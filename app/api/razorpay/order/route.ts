import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createRazorpayOrder } from "@/lib/razorpay"
import { createPurchaseOrder } from "@/lib/db"
import { getPlanById, getAdTypeById } from "@/lib/products"

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { planId, isAdPayment, adType } = await request.json()

    if (isAdPayment) {
      // Handle advertisement payment
      if (!adType) {
        return NextResponse.json({ error: "Ad type required" }, { status: 400 })
      }

      const adTypeConfig = getAdTypeById(adType)

      if (!adTypeConfig) {
        return NextResponse.json({ error: "Invalid ad type" }, { status: 400 })
      }

      if (adTypeConfig.pricing.IN.amount <= 0) {
        return NextResponse.json(
          { error: "This ad type is not available for purchase" },
          { status: 400 }
        )
      }

      // Create real Razorpay order for advertisement
      const order = await createRazorpayOrder(adTypeConfig.pricing.IN.amount, adType)

      // Persist order for advertisement
      await createPurchaseOrder({
        orderId: order.id,
        email: session.user.email,
        planId: adType, // Use adType as planId for ads
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
        isAdPayment: true,
        adType,
      })
    } else {
      // Handle regular plan payment
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
    }
  } catch (error) {
    console.error("Razorpay order error:", error)
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    )
  }
}
