import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createRazorpayOrder } from "@/lib/razorpay"
import { createPurchaseOrder } from "@/lib/db"
import { getPlanById, getAdTypeById } from "@/lib/products"
import { getCreditPackById, getCreditPackPrice } from "@/lib/credit-packs"
import { getPlanByTier, getPlanPrice } from "@/lib/plans"
import { writeUsageEvent } from "@/lib/usage"

type OrderKind = "subscription" | "credit_pack" | "ad"

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      planId,
      isAdPayment,
      adType,
      couponCode,
      useCredits,
      currency = "INR",
      cycle = "monthly",
      kind: kindRaw,
      creditPackId,
    } = body as {
      planId?: string
      isAdPayment?: boolean
      adType?: string
      couponCode?: string
      useCredits?: boolean
      currency?: "INR" | "USD"
      cycle?: "monthly" | "annual"
      kind?: OrderKind
      creditPackId?: string
    }

    const kind: OrderKind = kindRaw ?? (isAdPayment ? "ad" : creditPackId ? "credit_pack" : "subscription")

    if (kind === "ad") {
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
          { status: 400 },
        )
      }

      const order = await createRazorpayOrder(adTypeConfig.pricing.IN.amount, adType, {
        customerName: session.user.name || undefined,
        customerEmail: session.user.email,
        notes: { paymentType: "advertisement", adType },
      })

      await createPurchaseOrder({
        orderId: order.id,
        email: session.user.email,
        planId: adType,
        kind: "ad",
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
    }

    if (kind === "credit_pack") {
      if (!creditPackId) {
        return NextResponse.json({ error: "creditPackId required" }, { status: 400 })
      }
      const pack = getCreditPackById(creditPackId)
      if (!pack) {
        return NextResponse.json({ error: "Invalid credit pack" }, { status: 400 })
      }
      const country: "IN" | "US" = currency === "USD" ? "US" : "IN"
      const price = getCreditPackPrice(pack, country)
      if (price.amount <= 0) {
        return NextResponse.json({ error: "Pack pricing unavailable" }, { status: 400 })
      }

      const order = await createRazorpayOrder(price.amount, creditPackId, {
        currency: price.currency,
        customerName: session.user.name || undefined,
        customerEmail: session.user.email,
        notes: { paymentType: "credit_pack", creditPackId, credits: String(pack.credits) },
      })

      await createPurchaseOrder({
        orderId: order.id,
        email: session.user.email,
        planId: creditPackId,
        kind: "credit_pack",
        creditPackId,
        creditAmount: pack.credits,
        provider: "razorpay",
        amount: price.amount,
        currency: order.currency,
        status: "created",
        paymentId: null,
        couponCode: null,
        couponDiscount: 0,
        referralDiscount: 0,
        creditDiscount: 0,
        finalAmount: price.amount,
        appliedReferralCode: null,
        referrerEmail: null,
      })

      await writeUsageEvent(session.user.email, "checkout_started", {
        kind: "credit_pack",
        creditPackId,
        credits: pack.credits,
      })

      return NextResponse.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        kind: "credit_pack",
        creditPackId,
        credits: pack.credits,
      })
    }

    // Subscription kind.
    if (!planId) {
      return NextResponse.json({ error: "Plan ID required" }, { status: 400 })
    }

    const plan = getPlanById(planId)
    if (!plan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }
    if (plan.pricing.IN.amount <= 0 && currency === "INR") {
      return NextResponse.json(
        { error: "This plan is not available for purchase" },
        { status: 400 },
      )
    }

    const tierPlan = getPlanByTier(plan.id)
    const billingCycle: "monthly" | "annual" = cycle === "annual" ? "annual" : "monthly"
    const country: "IN" | "US" = currency === "USD" ? "US" : "IN"
    const planPrice = tierPlan ? getPlanPrice(tierPlan, country, billingCycle) : { amount: plan.pricing.IN.amount, currency: "INR" as const }

    const quoteRes = await fetch(
      new URL("/api/checkout/quote", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
      {
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
          cycle: billingCycle,
        }),
      },
    )

    if (!quoteRes.ok) {
      const errBody = await quoteRes.json().catch(() => ({}))
      return NextResponse.json({ error: errBody.error || "Failed to apply discounts" }, { status: 400 })
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

    const order = await createRazorpayOrder(quote.finalAmount, planId, {
      currency: planPrice.currency,
      customerName: session.user.name || undefined,
      customerEmail: session.user.email,
      notes: {
        planId,
        cycle: billingCycle,
        couponCode: quote.couponCode || "none",
        referralDiscount: quote.referralDiscount.toString(),
        creditDiscount: quote.creditDiscount.toString(),
        appliedReferralCode: quote.appliedReferralCode || "none",
      },
    })

    await createPurchaseOrder({
      orderId: order.id,
      email: session.user.email,
      planId,
      kind: "subscription",
      billingCycle,
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

    await writeUsageEvent(session.user.email, "checkout_started", {
      kind: "subscription",
      planId,
      cycle: billingCycle,
      finalAmount: quote.finalAmount,
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
        cycle: billingCycle,
      },
    })
  } catch (error) {
    console.error("Razorpay order error:", error)
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}
