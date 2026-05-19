import { NextResponse } from "next/server"
import {
  applyPlanPurchase,
  getPaidPurchaseCountByEmail,
  getPurchaseOrderByOrderId,
  getUserByEmail,
  isWebhookProcessed,
  markPurchaseOrderPaid,
  markWebhookProcessed,
  updateUser,
} from "@/lib/db"
import {
  type PaddleWebhookPayload,
  verifyPaddleSignature,
  mapPriceToPlan,
  getPaddleUserEmail,
  getPaddlePriceId,
} from "@/lib/paddle"
import { computeFreePlanExpiresAt } from "@/lib/subscription-access"
import { grant as grantAiCredits } from "@/lib/credits"
import { getCreditPackById } from "@/lib/credit-packs"
import { applyReferralRewards } from "@/lib/referrals"
import { writeUsageEvent } from "@/lib/usage"

export async function POST(request: Request) {
  const secret = process.env.PADDLE_WEBHOOK_SECRET

  if (!secret) {
    console.error("PADDLE_WEBHOOK_SECRET not configured")
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    )
  }

  const rawBody = await request.text()
  const signatureHeader = request.headers.get("Paddle-Signature")

  if (!signatureHeader) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  if (!verifyPaddleSignature(rawBody, signatureHeader, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const payload: PaddleWebhookPayload = JSON.parse(rawBody)
  const eventType = payload.event_type
  const eventId = payload.event_id

  if (await isWebhookProcessed("paddle", eventId)) {
    return NextResponse.json({ received: true, alreadyProcessed: true })
  }

  const userEmail = getPaddleUserEmail(payload)
  const customData = payload.data.custom_data

  if (!userEmail) {
    console.error(`Paddle webhook ${eventType} missing user email`)
    return NextResponse.json({ error: "Missing user email" }, { status: 400 })
  }

  try {
    switch (eventType) {
      case "transaction.completed": {
        const priceId = getPaddlePriceId(payload)

        if (customData?.kind === "credit_pack" && customData.creditPackId) {
          const pack = getCreditPackById(customData.creditPackId)
          if (pack) {
            await grantAiCredits(userEmail, {
              amount: pack.credits,
              source: "credit_pack",
              metadata: {
                provider: "paddle",
                orderId: payload.data.id,
                packId: pack.id,
              },
            })
            await writeUsageEvent(userEmail, "credit_pack_purchased", {
              orderId: payload.data.id,
              packId: pack.id,
              credits: pack.credits,
            })
          }
        } else if (priceId) {
          const { planType } = mapPriceToPlan(priceId)
          if (planType !== "free") {
            const paidCountBefore = await getPaidPurchaseCountByEmail(userEmail)
            const order = await getPurchaseOrderByOrderId(payload.data.id)
            await applyPlanPurchase(userEmail, planType, payload.data.id, {
              provider: "paddle",
              cycle: "monthly",
            })
            await updateUser(userEmail, {
              paddleCustomerId: payload.data.customer_id,
              paddleSubscriptionId: payload.data.subscription_id ?? null,
            })
            if (order) await markPurchaseOrderPaid(order.orderId, payload.data.id)
            await applyReferralRewards({
              orderId: payload.data.id,
              newPaidUserEmail: userEmail,
              appliedReferralCode: order?.appliedReferralCode ?? null,
              referrerEmail: order?.referrerEmail ?? null,
              currency: "USD",
              paidCountBefore,
            })
            await writeUsageEvent(userEmail, "checkout_completed", {
              kind: "subscription",
              provider: "paddle",
              orderId: payload.data.id,
            })
          }
        }
        break
      }

      case "subscription.created":
      case "subscription.resumed": {
        const priceId = getPaddlePriceId(payload)
        if (!priceId) break
        const { planType } = mapPriceToPlan(priceId)
        const paidCountBefore = await getPaidPurchaseCountByEmail(userEmail)
        await applyPlanPurchase(userEmail, planType, payload.data.id, {
          provider: "paddle",
          cycle: "monthly",
        })
        await updateUser(userEmail, {
          paddleCustomerId: payload.data.customer_id,
          paddleSubscriptionId: payload.data.id,
          subscriptionExpiry: payload.data.next_billed_at
            ? new Date(payload.data.next_billed_at)
            : null,
          dunning: false,
        })
        const userBefore = await getUserByEmail(userEmail)
        await applyReferralRewards({
          orderId: payload.data.id,
          newPaidUserEmail: userEmail,
          appliedReferralCode: userBefore?.referredByCode ?? null,
          referrerEmail: null,
          currency: "USD",
          paidCountBefore,
        })
        break
      }

      case "subscription.updated": {
        const priceId = getPaddlePriceId(payload)
        if (!priceId) break
        const { planType, projectLimit } = mapPriceToPlan(priceId)
        await updateUser(userEmail, {
          planType,
          planTier: planType,
          projectLimit,
          subscriptionExpiry: payload.data.next_billed_at
            ? new Date(payload.data.next_billed_at)
            : null,
        })
        break
      }

      case "transaction.payment_failed": {
        await updateUser(userEmail, { dunning: true })
        await writeUsageEvent(userEmail, "checkout_abandoned", {
          provider: "paddle",
          reason: "payment_failed",
          transactionId: payload.data.id,
        })
        break
      }

      case "subscription.past_due": {
        await updateUser(userEmail, { dunning: true })
        break
      }

      case "subscription.paused": {
        await updateUser(userEmail, { dunning: true })
        break
      }

      case "subscription.canceled": {
        const endsAt = payload.data.ends_at
        await updateUser(userEmail, {
          planType: "free",
          planTier: "free",
          projectLimit: 3,
          subscriptionExpiry: endsAt
            ? new Date(endsAt)
            : computeFreePlanExpiresAt(),
          paddleSubscriptionId: null,
          pendingDowngradeTo: "free",
          pendingDowngradeAt: endsAt ? new Date(endsAt) : null,
        })
        break
      }

      default: {
        const _exhaustive: never = eventType as never
        void _exhaustive
      }
    }

    await markWebhookProcessed("paddle", eventId, eventType)
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Paddle webhook processing error:", error)
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    )
  }
}
