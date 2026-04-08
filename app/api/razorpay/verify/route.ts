import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { updateUser } from "@/lib/db"
import { verifyMockRazorpaySignature, mapPlanToRazorpay } from "@/lib/razorpay"

export async function POST(request: Request) {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const {
      planId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await request.json()

    // Verify signature
    const isValid = verifyMockRazorpaySignature(
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

    // Update user subscription
    const { planType, projectLimit } = mapPlanToRazorpay(planId)
    
    // Set expiry to 30 days from now
    const subscriptionExpiry = new Date()
    subscriptionExpiry.setDate(subscriptionExpiry.getDate() + 30)

    await updateUser(session.user.email, {
      planType: planType as "free" | "1-project" | "5-projects" | "50-projects" | "100-projects" | "business",
      projectLimit,
      razorpayCustomerId: razorpay_payment_id,
      subscriptionExpiry,
    })

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
