import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import {
  applyPlanPurchase,
  getPurchaseOrderByOrderId,
  markPurchaseOrderPaid,
} from "@/lib/db"
import { verifyRazorpaySignature } from "@/lib/razorpay"

export async function POST(request: Request) {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await request.json()

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing payment verification fields" },
        { status: 400 }
      )
    }

    const order = await getPurchaseOrderByOrderId(razorpay_order_id)
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (order.email !== session.user.email) {
      return NextResponse.json({ error: "Order does not belong to user" }, { status: 403 })
    }

    if (order.status !== "created") {
      return NextResponse.json(
        { error: "Order already processed" },
        { status: 409 }
      )
    }

    // Verify signature
    const isValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    )

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      )
    }

    const updatedUser = await applyPlanPurchase(
      session.user.email,
      order.planId,
      razorpay_payment_id
    )
    if (!updatedUser) {
      return NextResponse.json(
        { error: "Failed to activate subscription" },
        { status: 500 }
      )
    }

    await markPurchaseOrderPaid(razorpay_order_id, razorpay_payment_id)

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
    })
  } catch (error) {
    console.error("Razorpay verify error:", error)
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    )
  }
}
