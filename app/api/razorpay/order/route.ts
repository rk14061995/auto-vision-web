import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createRazorpayOrder } from "@/lib/razorpay"
import { createPurchaseOrder } from "@/lib/db"
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

    // Create real Razorpay order
    const order = await createRazorpayOrder(plan.pricing.IN.amount, planId)

    // Persist order so verification can activate the right subscription safely
    await createPurchaseOrder({
      orderId: order.id,
      email: session.user.email,
      planId,
      provider: "razorpay",
      amount: order.amount,
      currency: order.currency,
      status: "created",
      paymentId: null,
    })

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    })
  } catch (error) {
    console.error("Razorpay order error:", error)
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    )
  }
}
