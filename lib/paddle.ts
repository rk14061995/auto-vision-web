import "server-only"

import crypto from "node:crypto"
import type { PlanTier } from "./db"
import { CREATOR_PLAN, PRO_PLAN, STUDIO_PLAN, ENTERPRISE_PLAN } from "./plans"

export type PaddleEventName =
  | "transaction.completed"
  | "transaction.payment_failed"
  | "subscription.created"
  | "subscription.updated"
  | "subscription.canceled"
  | "subscription.past_due"
  | "subscription.paused"
  | "subscription.resumed"

export interface PaddleWebhookPayload {
  event_type: PaddleEventName
  event_id: string
  occurred_at: string
  data: {
    id: string
    customer_id: string
    status?: string
    items?: Array<{
      price: { id: string; product_id?: string }
      quantity: number
    }>
    // For subscriptions
    next_billed_at?: string
    ends_at?: string
    scheduled_change?: {
      action: "cancel" | "pause" | "resume"
      effective_at: string
    }
    // For transactions
    subscription_id?: string
    customer?: { email?: string }
    custom_data?: {
      user_id?: string
      email?: string
      kind?: "subscription" | "credit_pack"
      creditPackId?: string
    }
  }
}

interface PriceMapping {
  tier: PlanTier
  projectLimit: number
}

function buildPriceMap(): Record<string, PriceMapping> {
  const map: Record<string, PriceMapping> = {}
  for (const plan of [CREATOR_PLAN, PRO_PLAN, STUDIO_PLAN, ENTERPRISE_PLAN]) {
    const priceId = plan.pricing.US.paddlePriceId
    if (priceId) {
      map[priceId] = { tier: plan.id, projectLimit: plan.projectLimit }
    }
  }
  return map
}

export function mapPriceToPlan(priceId: string): {
  planType: PlanTier
  projectLimit: number
} {
  const map = buildPriceMap()
  const found = map[priceId]
  if (found) return { planType: found.tier, projectLimit: found.projectLimit }
  return { planType: "free", projectLimit: 1 }
}

// Paddle Billing v2 signature: `Paddle-Signature: ts=1234567890;h1=abc...`
// Signed payload is "{ts}:{rawBody}" hashed with HMAC-SHA256 using the webhook secret.
export function verifyPaddleSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string,
): boolean {
  const tsPart = signatureHeader.split(";").find((p) => p.startsWith("ts="))
  const h1Part = signatureHeader.split(";").find((p) => p.startsWith("h1="))

  if (!tsPart || !h1Part) return false

  const ts = tsPart.slice(3)
  const h1 = h1Part.slice(3)

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${ts}:${rawBody}`)
    .digest("hex")

  try {
    return crypto.timingSafeEqual(Buffer.from(h1, "hex"), Buffer.from(expected, "hex"))
  } catch {
    return false
  }
}

export function getPaddleUserEmail(payload: PaddleWebhookPayload): string | null {
  return (
    payload.data.custom_data?.email ??
    payload.data.customer?.email ??
    null
  )
}

export function getPaddlePriceId(payload: PaddleWebhookPayload): string | null {
  return payload.data.items?.[0]?.price?.id ?? null
}
