import { NextResponse } from "next/server"
import {
  applyPlanPurchase,
  getPaidPurchaseCountByEmail,
  getUserByEmail,
  isWebhookProcessed,
  markWebhookProcessed,
  updateUser,
} from "@/lib/db"
import {
  type PayPalWebhookPayload,
  verifyPayPalWebhook,
  mapPayPalPlanIdToTier,
  getPayPalUserEmail,
  getPayPalPlanId,
  getPayPalSubscriptionId,
  getPayPalNextBillingTime,
} from "@/lib/paypal"
import { computeFreePlanExpiresAt } from "@/lib/subscription-access"
import { applyReferralRewards } from "@/lib/referrals"
import { writeUsageEvent } from "@/lib/usage"

export async function POST(request: Request) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID

  if (!webhookId) {
    console.error("PAYPAL_WEBHOOK_ID not configured")
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 })
  }

  const rawBody = await request.text()

  const transmissionId = request.headers.get("paypal-transmission-id") ?? ""
  const transmissionTime = request.headers.get("paypal-transmission-time") ?? ""
  const certUrl = request.headers.get("paypal-cert-url") ?? ""
  const authAlgo = request.headers.get("paypal-auth-algo") ?? ""
  const transmissionSig = request.headers.get("paypal-transmission-sig") ?? ""

  if (!transmissionId || !transmissionSig) {
    return NextResponse.json({ error: "Missing PayPal signature headers" }, { status: 400 })
  }

  const valid = await verifyPayPalWebhook({
    transmissionId,
    transmissionTime,
    certUrl,
    authAlgo,
    transmissionSig,
    webhookId,
    rawBody,
  })

  if (!valid) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 })
  }

  const payload: PayPalWebhookPayload = JSON.parse(rawBody)
  const eventType = payload.event_type
  const eventId = payload.id

  if (await isWebhookProcessed("paypal", eventId)) {
    return NextResponse.json({ received: true, alreadyProcessed: true })
  }

  const userEmail = getPayPalUserEmail(payload)

  if (!userEmail) {
    console.error(`PayPal webhook ${eventType} missing user email`)
    return NextResponse.json({ error: "Missing user email" }, { status: 400 })
  }

  try {
    switch (eventType) {
      case "BILLING.SUBSCRIPTION.ACTIVATED":
      case "BILLING.SUBSCRIPTION.CREATED": {
        const paypalPlanId = getPayPalPlanId(payload)
        if (!paypalPlanId) break
        const { planType, projectLimit } = mapPayPalPlanIdToTier(paypalPlanId)
        if (planType === "free") break
        const subscriptionId = getPayPalSubscriptionId(payload)
        const nextBilling = getPayPalNextBillingTime(payload)
        const paidCountBefore = await getPaidPurchaseCountByEmail(userEmail)

        await applyPlanPurchase(userEmail, planType, subscriptionId ?? eventId, {
          provider: "paypal",
          cycle: "monthly",
        })
        await updateUser(userEmail, {
          paypalSubscriptionId: subscriptionId,
          planTier: planType,
          planType,
          projectLimit,
          subscriptionExpiry: nextBilling,
          dunning: false,
        })

        const userBefore = await getUserByEmail(userEmail)
        await applyReferralRewards({
          orderId: subscriptionId ?? eventId,
          newPaidUserEmail: userEmail,
          appliedReferralCode: userBefore?.referredByCode ?? null,
          referrerEmail: null,
          currency: "USD",
          paidCountBefore,
        })
        await writeUsageEvent(userEmail, "checkout_completed", {
          kind: "subscription",
          provider: "paypal",
          subscriptionId,
          paypalPlanId,
        })
        break
      }

      case "BILLING.SUBSCRIPTION.UPDATED":
      case "BILLING.SUBSCRIPTION.RE-ACTIVATED": {
        const paypalPlanId = getPayPalPlanId(payload)
        if (!paypalPlanId) break
        const { planType, projectLimit } = mapPayPalPlanIdToTier(paypalPlanId)
        const nextBilling = getPayPalNextBillingTime(payload)
        await updateUser(userEmail, {
          planType,
          planTier: planType,
          projectLimit,
          subscriptionExpiry: nextBilling,
          dunning: false,
        })
        await writeUsageEvent(userEmail, "subscription_updated", {
          provider: "paypal",
          paypalPlanId,
          newPlanType: planType,
        })
        break
      }

      case "BILLING.SUBSCRIPTION.SUSPENDED": {
        await updateUser(userEmail, { dunning: true })
        await writeUsageEvent(userEmail, "subscription_suspended", {
          provider: "paypal",
          subscriptionId: getPayPalSubscriptionId(payload),
        })
        break
      }

      case "BILLING.SUBSCRIPTION.CANCELLED":
      case "BILLING.SUBSCRIPTION.EXPIRED": {
        await updateUser(userEmail, {
          planType: "free",
          planTier: "free",
          projectLimit: 3,
          subscriptionExpiry: computeFreePlanExpiresAt(),
          paypalSubscriptionId: null,
          pendingDowngradeTo: "free",
          pendingDowngradeAt: new Date(),
        })
        await writeUsageEvent(userEmail, "subscription_cancelled", {
          provider: "paypal",
          eventType,
        })
        break
      }

      case "PAYMENT.SALE.COMPLETED": {
        // Renewal payment — extend subscription expiry, clear dunning flag
        const subscriptionId = getPayPalSubscriptionId(payload)
        await updateUser(userEmail, { dunning: false })
        await writeUsageEvent(userEmail, "payment_received", {
          provider: "paypal",
          subscriptionId,
          amount: payload.resource.amount?.total,
          currency: payload.resource.amount?.currency_code,
        })
        break
      }

      case "PAYMENT.SALE.DENIED":
      case "PAYMENT.SALE.REFUNDED": {
        await updateUser(userEmail, { dunning: true })
        await writeUsageEvent(userEmail, "checkout_abandoned", {
          provider: "paypal",
          reason: eventType.toLowerCase(),
          subscriptionId: getPayPalSubscriptionId(payload),
        })
        break
      }

      default: {
        // Unhandled event — log and ack to prevent PayPal retrying
        console.log(`PayPal webhook: unhandled event ${eventType}`)
      }
    }

    await markWebhookProcessed("paypal", eventId, eventType)
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("PayPal webhook processing error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
