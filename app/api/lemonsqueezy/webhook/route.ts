import { NextResponse } from "next/server"
import crypto from "node:crypto"
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
  type LemonSqueezyWebhookPayload,
  mapVariantToPlan,
} from "@/lib/lemonsqueezy"
import { computeFreePlanExpiresAt } from "@/lib/subscription-access"
import { grant as grantAiCredits } from "@/lib/credits"
import { getCreditPackById } from "@/lib/credit-packs"
import { applyReferralRewards } from "@/lib/referrals"
import { writeUsageEvent } from "@/lib/usage"

export async function POST(request: Request) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET

  if (!secret) {
    console.error("LEMONSQUEEZY_WEBHOOK_SECRET not configured")
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    )
  }

  const rawBody = await request.text()
  const signatureHeader = request.headers.get("X-Signature")

  if (!signatureHeader) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  const signature = Buffer.from(signatureHeader, "hex")
  const hmac = Buffer.from(
    crypto.createHmac("sha256", secret).update(rawBody).digest("hex"),
    "hex",
  )

  if (
    signature.length !== hmac.length ||
    !crypto.timingSafeEqual(hmac, signature)
  ) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const payload: LemonSqueezyWebhookPayload = JSON.parse(rawBody)
  const eventName = payload.meta.event_name
  const eventId =
    payload.meta.event_id ??
    `${eventName}:${payload.data.id}:${payload.data.attributes.order_id ?? ""}`

  // Idempotency: drop duplicates without changing state.
  if (await isWebhookProcessed("lemonsqueezy", eventId)) {
    return NextResponse.json({ received: true, alreadyProcessed: true })
  }

  const { user_email, customer_id } = payload.data.attributes
  const variantId = payload.data.attributes.variant_id?.toString()
  const customData = payload.meta.custom_data

  console.log(`Lemon Squeezy webhook: ${eventName} for ${user_email}`)

  try {
    switch (eventName) {
      case "order_created": {
        // Credit pack purchase carries kind=credit_pack in custom_data.
        if (customData?.kind === "credit_pack" && customData.creditPackId) {
          const pack = getCreditPackById(customData.creditPackId)
          if (pack) {
            await grantAiCredits(user_email, {
              amount: pack.credits,
              source: "credit_pack",
              metadata: {
                provider: "lemonsqueezy",
                orderId: payload.data.id,
                packId: pack.id,
              },
            })
            await writeUsageEvent(user_email, "credit_pack_purchased", {
              orderId: payload.data.id,
              packId: pack.id,
              credits: pack.credits,
            })
          }
        } else {
          // Treat as a one-time subscription order.
          const { planType } = mapVariantToPlan(variantId)
          if (planType !== "free") {
            const paidCountBefore = await getPaidPurchaseCountByEmail(user_email)
            const order = await getPurchaseOrderByOrderId(payload.data.id)
            await applyPlanPurchase(user_email, planType, payload.data.id, {
              provider: "lemonsqueezy",
              cycle: "monthly",
            })
            await updateUser(user_email, {
              lemonSqueezyCustomerId: customer_id?.toString(),
              lemonSqueezySubscriptionId: payload.data.id,
            })
            if (order) await markPurchaseOrderPaid(order.orderId, payload.data.id)
            await applyReferralRewards({
              orderId: payload.data.id,
              newPaidUserEmail: user_email,
              appliedReferralCode: order?.appliedReferralCode ?? null,
              referrerEmail: order?.referrerEmail ?? null,
              currency: "USD",
              paidCountBefore,
            })
            await writeUsageEvent(user_email, "checkout_completed", {
              kind: "subscription",
              provider: "lemonsqueezy",
              orderId: payload.data.id,
            })
          }
        }
        break
      }

      case "subscription_created":
      case "subscription_resumed":
      case "subscription_unpaused": {
        const { planType } = mapVariantToPlan(variantId)
        const paidCountBefore = await getPaidPurchaseCountByEmail(user_email)
        await applyPlanPurchase(user_email, planType, payload.data.id, {
          provider: "lemonsqueezy",
          cycle: "monthly",
        })
        await updateUser(user_email, {
          lemonSqueezyCustomerId: customer_id?.toString(),
          lemonSqueezySubscriptionId: payload.data.id,
          subscriptionExpiry: payload.data.attributes.renews_at
            ? new Date(payload.data.attributes.renews_at)
            : null,
          dunning: false,
        })
        const userBefore = await getUserByEmail(user_email)
        await applyReferralRewards({
          orderId: payload.data.id,
          newPaidUserEmail: user_email,
          appliedReferralCode: userBefore?.referredByCode ?? null,
          referrerEmail: null, // resolved inside referrals service via referralCode
          currency: "USD",
          paidCountBefore,
        })
        break
      }

      case "subscription_updated": {
        const { planType, projectLimit } = mapVariantToPlan(variantId)
        const renewsAt = payload.data.attributes.renews_at
        await updateUser(user_email, {
          planType,
          planTier: planType,
          projectLimit,
          subscriptionExpiry: renewsAt ? new Date(renewsAt) : null,
        })
        break
      }

      case "subscription_payment_success": {
        await updateUser(user_email, { dunning: false })
        break
      }

      case "subscription_payment_failed": {
        await updateUser(user_email, { dunning: true })
        await writeUsageEvent(user_email, "checkout_abandoned", {
          provider: "lemonsqueezy",
          reason: "payment_failed",
          subscriptionId: payload.data.id,
        })
        break
      }

      case "subscription_paused": {
        await updateUser(user_email, {
          dunning: true,
          // Don't downgrade immediately; preserve plan so resume restores it.
        })
        break
      }

      case "subscription_cancelled":
      case "subscription_expired": {
        const endsAt = payload.data.attributes.ends_at
        await updateUser(user_email, {
          planType: "free",
          planTier: "free",
          projectLimit: 3,
          subscriptionExpiry: endsAt ? new Date(endsAt) : computeFreePlanExpiresAt(),
          lemonSqueezySubscriptionId: null,
          pendingDowngradeTo: "free",
          pendingDowngradeAt: endsAt ? new Date(endsAt) : null,
        })
        break
      }

      case "order_refunded": {
        // Best-effort: revoke the subscription tier. Credits already granted
        // for credit_pack orders are NOT clawed back automatically; surface to
        // admin via dunning flag.
        await updateUser(user_email, {
          planType: "free",
          planTier: "free",
          projectLimit: 3,
          subscriptionExpiry: computeFreePlanExpiresAt(),
          lemonSqueezySubscriptionId: null,
          dunning: true,
        })
        await writeUsageEvent(user_email, "checkout_abandoned", {
          provider: "lemonsqueezy",
          reason: "refunded",
          orderId: payload.data.id,
        })
        break
      }

      default: {
        const _exhaustive: never = eventName as never
        void _exhaustive
        console.log(`Unhandled event: ${eventName}`)
      }
    }

    await markWebhookProcessed("lemonsqueezy", eventId, eventName)
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook processing error:", error)
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    )
  }
}
