import "server-only"

import type { PlanTier } from "./db"
import { CREATOR_PLAN, PRO_PLAN, STUDIO_PLAN } from "./plans"

// ─── Event types ─────────────────────────────────────────────────────────────

export type PayPalEventName =
  | "BILLING.SUBSCRIPTION.CREATED"
  | "BILLING.SUBSCRIPTION.ACTIVATED"
  | "BILLING.SUBSCRIPTION.UPDATED"
  | "BILLING.SUBSCRIPTION.CANCELLED"
  | "BILLING.SUBSCRIPTION.SUSPENDED"
  | "BILLING.SUBSCRIPTION.EXPIRED"
  | "BILLING.SUBSCRIPTION.RE-ACTIVATED"
  | "PAYMENT.SALE.COMPLETED"
  | "PAYMENT.SALE.DENIED"
  | "PAYMENT.SALE.REFUNDED"

export interface PayPalWebhookPayload {
  id: string
  event_type: PayPalEventName
  event_version: string
  create_time: string
  resource_type: string
  resource: {
    id: string
    plan_id?: string
    status?: string
    subscriber?: {
      email_address: string
      name?: { given_name?: string; surname?: string }
    }
    custom_id?: string
    billing_info?: {
      next_billing_time?: string
    }
    // For PAYMENT.SALE.*
    amount?: { total: string; currency_code: string }
    billing_agreement_id?: string
  }
  summary: string
}

// ─── Auth / token ─────────────────────────────────────────────────────────────

export function getPayPalBaseUrl(): string {
  return process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com"
}

let _cachedToken: { token: string; expiresAt: number } | null = null

export async function getPayPalAccessToken(): Promise<string> {
  if (_cachedToken && Date.now() < _cachedToken.expiresAt) return _cachedToken.token

  const clientId = process.env.PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error("PayPal credentials not configured")

  const res = await fetch(`${getPayPalBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  })

  if (!res.ok) throw new Error(`PayPal auth failed: ${res.status}`)
  const data = await res.json()
  _cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  }
  return _cachedToken.token
}

// ─── Webhook verification ─────────────────────────────────────────────────────
//
// Uses PayPal's official verify-webhook-signature endpoint. This is the
// recommended approach — local cert verification is fragile due to cert rotation.

export async function verifyPayPalWebhook(params: {
  transmissionId: string
  transmissionTime: string
  certUrl: string
  authAlgo: string
  transmissionSig: string
  webhookId: string
  rawBody: string
}): Promise<boolean> {
  try {
    const accessToken = await getPayPalAccessToken()
    const res = await fetch(
      `${getPayPalBaseUrl()}/v1/notifications/verify-webhook-signature`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transmission_id: params.transmissionId,
          transmission_time: params.transmissionTime,
          cert_url: params.certUrl,
          auth_algo: params.authAlgo,
          transmission_sig: params.transmissionSig,
          webhook_id: params.webhookId,
          webhook_event: JSON.parse(params.rawBody),
        }),
        cache: "no-store",
      },
    )

    if (!res.ok) return false
    const data = await res.json()
    return data.verification_status === "SUCCESS"
  } catch {
    return false
  }
}

// ─── Plan ID → internal plan mapping ─────────────────────────────────────────

function buildPlanIdMap(): Record<string, { tier: PlanTier; projectLimit: number }> {
  const map: Record<string, { tier: PlanTier; projectLimit: number }> = {}
  for (const plan of [CREATOR_PLAN, PRO_PLAN, STUDIO_PLAN]) {
    const planId = plan.pricing.US.paypalPlanId
    if (planId) map[planId] = { tier: plan.id, projectLimit: plan.projectLimit }
  }
  return map
}

export function mapPayPalPlanIdToTier(paypalPlanId: string): {
  planType: PlanTier
  projectLimit: number
} {
  const map = buildPlanIdMap()
  const found = map[paypalPlanId]
  if (found) return { planType: found.tier, projectLimit: found.projectLimit }
  return { planType: "free", projectLimit: 1 }
}

// ─── Payload helpers ──────────────────────────────────────────────────────────

export function getPayPalUserEmail(payload: PayPalWebhookPayload): string | null {
  return (
    payload.resource.subscriber?.email_address ??
    payload.resource.custom_id ?? // fallback: we pass email as custom_id on subscription create
    null
  )
}

export function getPayPalPlanId(payload: PayPalWebhookPayload): string | null {
  return payload.resource.plan_id ?? null
}

export function getPayPalSubscriptionId(payload: PayPalWebhookPayload): string | null {
  // For subscription events the resource id IS the subscription id.
  // For PAYMENT.SALE.* it's billing_agreement_id.
  return payload.resource.billing_agreement_id ?? payload.resource.id ?? null
}

export function getPayPalNextBillingTime(payload: PayPalWebhookPayload): Date | null {
  const t = payload.resource.billing_info?.next_billing_time
  return t ? new Date(t) : null
}
