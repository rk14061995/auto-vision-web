import "server-only"

export function getLemonSqueezyCheckoutUrl(
  variantId: string,
  email?: string
): string {
  const storeId = process.env.LEMONSQUEEZY_STORE_ID || "your-store"
  const baseUrl = `https://${storeId}.lemonsqueezy.com/checkout/buy/${variantId}`
  
  if (email) {
    return `${baseUrl}?checkout[email]=${encodeURIComponent(email)}`
  }
  
  return baseUrl
}

// Webhook event types
export type LemonSqueezyEventName =
  | "order_created"
  | "subscription_created"
  | "subscription_updated"
  | "subscription_cancelled"
  | "subscription_resumed"
  | "subscription_expired"
  | "subscription_paused"
  | "subscription_unpaused"

export interface LemonSqueezyWebhookPayload {
  meta: {
    event_name: LemonSqueezyEventName
    custom_data?: {
      user_id?: string
      email?: string
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

export function mapVariantToPlan(variantId: string): {
  planType: string
  projectLimit: number
} {
  const variantMap: Record<string, { planType: string; projectLimit: number }> = {
    VARIANT_STARTER: { planType: "1-project", projectLimit: 1 },
    VARIANT_PRO: { planType: "5-projects", projectLimit: 5 },
    VARIANT_TEAM: { planType: "50-projects", projectLimit: 50 },
    VARIANT_BUSINESS: { planType: "100-projects", projectLimit: 100 },
  }
  
  return variantMap[variantId] || { planType: "free", projectLimit: 1 }
}
