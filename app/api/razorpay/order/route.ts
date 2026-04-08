import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createMockRazorpayOrder } from "@/lib/razorpay"
import { getPlanById } from "@/lib/products"

export async function POST(request: Request) {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { planId } = await request.json()
    
    if (!planId) {
      return NextResponse.json({ error: "Plan ID required" }, { status: 400 })
    }

    const plan = getPlanById(planId)
    
    if (!plan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    if (plan.pricing.IN.amount <= 0) {
      return NextResponse.json(
        { error: "This plan is not available for purchase" },
        { status: 400 }
      )
    }

    // Create mock Razorpay order
    const order = await createMockRazorpayOrder(plan.pricing.IN.amount, planId)

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_mock",
    })
  } catch (error) {
    console.error("Razorpay order error:", error)
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    )
  }
}
