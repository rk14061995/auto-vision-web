// Mock Razorpay utilities for India payments
// In production, replace with actual Razorpay SDK integration

export interface RazorpayOrder {
  id: string
  amount: number
  currency: string
  receipt: string
  status: "created" | "attempted" | "paid"
  created_at: number
}

export interface RazorpayPaymentResponse {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

// Generate mock order ID
function generateOrderId(): string {
  return `order_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`
}

// Generate mock payment ID
function generatePaymentId(): string {
  return `pay_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`
}

// Create mock Razorpay order
export async function createMockRazorpayOrder(
  amount: number,
  planId: string
): Promise<RazorpayOrder> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))
  
  return {
    id: generateOrderId(),
    amount: amount * 100, // Razorpay uses paise
    currency: "INR",
    receipt: `receipt_${planId}_${Date.now()}`,
    status: "created",
    created_at: Date.now(),
  }
}

// Mock signature verification
export function verifyMockRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  // In a real implementation, you would verify the signature using:
  // generated_signature = hmac_sha256(order_id + "|" + razorpay_payment_id, secret)
  // return generated_signature === razorpay_signature
  
  // For mock purposes, we accept any signature that starts with "mock_sig_"
  return signature.startsWith("mock_sig_")
}

// Generate mock payment response (simulating successful payment)
export function generateMockPaymentResponse(
  orderId: string
): RazorpayPaymentResponse {
  return {
    razorpay_order_id: orderId,
    razorpay_payment_id: generatePaymentId(),
    razorpay_signature: `mock_sig_${Date.now()}`,
  }
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
