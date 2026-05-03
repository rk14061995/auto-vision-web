import { NextResponse } from "next/server"
import crypto from "node:crypto"
import {
  addUserCredit,
  getUserByEmail,
  getUserByReferralCode,
  recordReferralReward,
  updateUser,
} from "@/lib/db"
import {
  type LemonSqueezyWebhookPayload,
  mapVariantToPlan,
} from "@/lib/lemonsqueezy"
import { computeFreePlanExpiresAt } from "@/lib/subscription-access"

export async function POST(request: Request) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET
  
  if (!secret) {
    console.error("LEMONSQUEEZY_WEBHOOK_SECRET not configured")
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    )
  }

  const rawBody = await request.text()
  const signatureHeader = request.headers.get("X-Signature")

  if (!signatureHeader) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  // Verify signature
  const signature = Buffer.from(signatureHeader, "hex")
  const hmac = Buffer.from(
    crypto.createHmac("sha256", secret).update(rawBody).digest("hex"),
    "hex"
  )

  if (!crypto.timingSafeEqual(hmac, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const payload: LemonSqueezyWebhookPayload = JSON.parse(rawBody)
  const eventName = payload.meta.event_name
  const { user_email, status, customer_id } = payload.data.attributes
  const variantId = payload.data.attributes.variant_id?.toString()

  console.log(`Lemon Squeezy webhook: ${eventName} for ${user_email}`)

  try {
    switch (eventName) {
      case "order_created":
      case "subscription_created": {
        const existingUser = await getUserByEmail(user_email)
        const { planType, projectLimit } = mapVariantToPlan(variantId)
        const renewsAt = payload.data.attributes.renews_at
        
        await updateUser(user_email, {
          planType: planType as "free" | "1-project" | "5-projects" | "50-projects" | "100-projects" | "business",
          projectLimit,
          lemonSqueezyCustomerId: customer_id.toString(),
          lemonSqueezySubscriptionId: payload.data.id,
          subscriptionExpiry: renewsAt ? new Date(renewsAt) : null,
        })

        if (
          existingUser?.referredByCode &&
          existingUser.planType === "free" &&
          existingUser.referredByCode
        ) {
          const referrer = await getUserByReferralCode(existingUser.referredByCode)
          if (referrer?.email && referrer.email !== user_email) {
            const rewardAmount = 5
            await addUserCredit({
              email: referrer.email,
              amount: rewardAmount,
              currency: "USD",
              type: "referral_reward",
            })
            await recordReferralReward({
              referrerEmail: referrer.email,
              referredEmail: user_email,
              orderId: payload.data.id,
              rewardAmount,
              currency: "USD",
            })
            await updateUser(user_email, { referredByCode: null })
          }
        }
        break
      }

      case "subscription_updated": {
        const { planType, projectLimit } = mapVariantToPlan(variantId)
        const renewsAt = payload.data.attributes.renews_at
        
        await updateUser(user_email, {
          planType: planType as "free" | "1-project" | "5-projects" | "50-projects" | "100-projects" | "business",
          projectLimit,
          subscriptionExpiry: renewsAt ? new Date(renewsAt) : null,
        })
        break
      }

      case "subscription_cancelled":
      case "subscription_expired": {
        await updateUser(user_email, {
          planType: "free",
          projectLimit: 1,
          subscriptionExpiry: computeFreePlanExpiresAt(),
          lemonSqueezySubscriptionId: null,
        })
        break
      }

      case "subscription_resumed":
      case "subscription_unpaused": {
        const { planType, projectLimit } = mapVariantToPlan(variantId)
        const renewsAt = payload.data.attributes.renews_at
        
        await updateUser(user_email, {
          planType: planType as "free" | "1-project" | "5-projects" | "50-projects" | "100-projects" | "business",
          projectLimit,
          subscriptionExpiry: renewsAt ? new Date(renewsAt) : null,
        })
        break
      }

      default:
        console.log(`Unhandled event: ${eventName}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook processing error:", error)
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    )
  }
}
