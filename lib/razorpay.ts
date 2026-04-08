import crypto from "node:crypto"

export interface RazorpayOrder {
  id: string
  amount: number
  currency: "INR"
  receipt: string
  status: "created" | "attempted" | "paid"
  created_at: number
}

export interface RazorpayPaymentResponse {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

export async function createRazorpayOrder(
  amount: number,
  planId: string
): Promise<RazorpayOrder> {
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials not configured")
  }

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64")
  const receipt = `receipt_${planId}_${Date.now()}`

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amount * 100,
      currency: "INR",
      receipt,
      payment_capture: 1,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Failed to create Razorpay order: ${body}`)
  }

  const order = (await response.json()) as RazorpayOrder
  return order
}

export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keySecret) return false

  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex")

  return expected === signature
}

// Plan mapping for Razorpay
export function mapPlanToRazorpay(planId: string): {
  planType: string
  projectLimit: number
} {
  const planMap: Record<string, { planType: string; projectLimit: number }> = {
    "1-project": { planType: "1-project", projectLimit: 1 },
    "5-projects": { planType: "5-projects", projectLimit: 5 },
    "50-projects": { planType: "50-projects", projectLimit: 50 },
    "100-projects": { planType: "100-projects", projectLimit: 100 },
  }
  
  return planMap[planId] || { planType: "free", projectLimit: 1 }
}
