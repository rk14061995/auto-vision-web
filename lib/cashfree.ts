import "server-only"
import crypto from "node:crypto"

export function getCashfreeBaseUrl(): string {
  return process.env.CASHFREE_MODE === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg"
}

function authHeaders() {
  return {
    "x-client-id": process.env.CASHFREE_APP_ID ?? "",
    "x-client-secret": process.env.CASHFREE_SECRET_KEY ?? "",
    "x-api-version": "2023-08-01",
    "Content-Type": "application/json",
  }
}

export interface CashfreeOrderResponse {
  cf_order_id: string
  order_id: string
  payment_session_id: string
  order_status: string
}

export async function createCashfreeOrder(params: {
  orderId: string
  amount: number
  currency?: "INR"
  customerEmail: string
  customerName?: string
  customerPhone?: string
  notes?: Record<string, string>
}): Promise<CashfreeOrderResponse> {
  const appId = process.env.CASHFREE_APP_ID
  const secretKey = process.env.CASHFREE_SECRET_KEY
  if (!appId || !secretKey) throw new Error("Cashfree credentials not configured")

  const res = await fetch(`${getCashfreeBaseUrl()}/orders`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      order_id: params.orderId,
      order_amount: params.amount,
      order_currency: params.currency ?? "INR",
      customer_details: {
        // Cashfree requires customer_id ≤ 50 chars, no @ allowed
        customer_id: crypto.createHash("md5").update(params.customerEmail).digest("hex").slice(0, 24),
        customer_email: params.customerEmail,
        customer_phone: params.customerPhone ?? "9999999999",
        customer_name: params.customerName ?? "",
      },
      order_meta: {
        notify_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/cashfree/webhook`,
      },
      order_tags: params.notes ?? {},
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Failed to create Cashfree order: ${body}`)
  }

  return res.json() as Promise<CashfreeOrderResponse>
}

export async function getCashfreeOrderStatus(orderId: string): Promise<{
  order_status: string
  cf_order_id: string
  order_id: string
  order_amount: number
  order_currency: string
}> {
  const res = await fetch(`${getCashfreeBaseUrl()}/orders/${orderId}`, {
    method: "GET",
    headers: authHeaders(),
    cache: "no-store",
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Failed to fetch Cashfree order: ${body}`)
  }

  return res.json()
}
