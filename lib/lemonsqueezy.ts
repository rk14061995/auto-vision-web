import "server-only"

import type { PlanTier } from "./db"
import { CREATOR_PLAN, PRO_PLAN, STUDIO_PLAN, ENTERPRISE_PLAN } from "./plans"

export function getLemonSqueezyCheckoutUrl(
  variantId: string,
  email?: string,
): string {
  const storeId = process.env.LEMONSQUEEZY_STORE_ID || "your-store"
  const baseUrl = `https://${storeId}.lemonsqueezy.com/checkout/buy/${variantId}`

  if (email) {
    return `${baseUrl}?checkout[email]=${encodeURIComponent(email)}`
  }

  return baseUrl
}

// Webhook event types we explicitly understand. Any event not in this union is
// logged as an unhandled event by the webhook handler.
export type LemonSqueezyEventName =
  | "order_created"
  | "order_refunded"
  | "subscription_created"
  | "subscription_updated"
  | "subscription_cancelled"
  | "subscription_resumed"
  | "subscription_expired"
  | "subscription_paused"
  | "subscription_unpaused"
  | "subscription_payment_success"
  | "subscription_payment_failed"

export interface LemonSqueezyWebhookPayload {
  meta: {
    event_name: LemonSqueezyEventName
    event_id?: string
    custom_data?: {
      user_id?: string
      email?: string
      kind?: "subscription" | "credit_pack"
      creditPackId?: string
    }
  }
  data: {
    id: string
    attributes: {
      user_email: string
      status: string
      product_id: number
      variant_id: number
      customer_id: number
      order_id?: number
      subscription_id?: number
      ends_at?: string
      renews_at?: string
    }
  }
}

interface VariantMapping {
  tier: PlanTier
  projectLimit: number
}

/**
 * Build the variant id -> plan tier map dynamically from the new plans
 * catalog so price changes don't drift from this lookup.
 */
function buildVariantMap(): Record<string, VariantMapping> {
  const map: Record<string, VariantMapping> = {}
  for (const plan of [CREATOR_PLAN, PRO_PLAN, STUDIO_PLAN, ENTERPRISE_PLAN]) {
    const variantId = plan.pricing.US.lemonSqueezyVariantId
    if (variantId) {
      map[variantId] = { tier: plan.id, projectLimit: plan.projectLimit }
    }
  }
  return map
}

export function mapVariantToPlan(variantId: string): {
  planType: PlanTier
  projectLimit: number
} {
  const map = buildVariantMap()
  const found = map[variantId]
  if (found) return { planType: found.tier, projectLimit: found.projectLimit }
  return { planType: "free", projectLimit: 1 }
}
