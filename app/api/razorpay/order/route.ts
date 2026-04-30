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
    const { planId, isAdPayment, adType, couponCode, useCredits, currency = "INR" } = await request.json()

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

      // Create real Razorpay order for advertisement with customer details
      const order = await createRazorpayOrder(adTypeConfig.pricing.IN.amount, adType, {
        customerName: session.user.name || undefined,
        customerEmail: session.user.email,
        notes: {
          paymentType: "advertisement",
          adType,
        },
      })

      // Persist order for advertisement
      await createPurchaseOrder({
        orderId: order.id,
        email: session.user.email,
        planId: adType, // Use adType as planId for ads
        provider: "razorpay",
        amount: adTypeConfig.pricing.IN.amount,
        currency: order.currency,
        status: "created",
        paymentId: null,
        couponCode: null,
        couponDiscount: 0,
        referralDiscount: 0,
        creditDiscount: 0,
        finalAmount: adTypeConfig.pricing.IN.amount,
        appliedReferralCode: null,
        referrerEmail: null,
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

      const quoteRes = await fetch(new URL("/api/checkout/quote", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: request.headers.get("cookie") || "",
        },
        body: JSON.stringify({
          planId,
          couponCode: couponCode || undefined,
          useCredits: !!useCredits,
          currency,
        }),
      })

      if (!quoteRes.ok) {
        const body = await quoteRes.json().catch(() => ({}))
        return NextResponse.json({ error: body.error || "Failed to apply discounts" }, { status: 400 })
      }

      const quote = (await quoteRes.json()) as {
        baseAmount: number
        couponCode: string | null
        couponDiscount: number
        referralDiscount: number
        creditDiscount: number
        finalAmount: number
        appliedReferralCode: string | null
        referrerEmail: string | null
      }

      // Create real Razorpay order with customer details and notes
      const order = await createRazorpayOrder(quote.finalAmount, planId, {
        currency,
        customerName: session.user.name || undefined,
        customerEmail: session.user.email,
        notes: {
          couponCode: quote.couponCode || "none",
          referralDiscount: quote.referralDiscount.toString(),
          creditDiscount: quote.creditDiscount.toString(),
          appliedReferralCode: quote.appliedReferralCode || "none",
        },
      })

      // Persist order so verification can activate the right subscription safely
      await createPurchaseOrder({
        orderId: order.id,
        email: session.user.email,
        planId,
        provider: "razorpay",
        amount: quote.baseAmount,
        currency: order.currency,
        status: "created",
        paymentId: null,
        couponCode: quote.couponCode,
        couponDiscount: quote.couponDiscount,
        referralDiscount: quote.referralDiscount,
        creditDiscount: quote.creditDiscount,
        finalAmount: quote.finalAmount,
        appliedReferralCode: quote.appliedReferralCode,
        referrerEmail: quote.referrerEmail,
      })

      return NextResponse.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        breakdown: {
          baseAmount: quote.baseAmount,
          couponCode: quote.couponCode,
          couponDiscount: quote.couponDiscount,
          referralDiscount: quote.referralDiscount,
          creditDiscount: quote.creditDiscount,
          finalAmount: quote.finalAmount,
        },
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
