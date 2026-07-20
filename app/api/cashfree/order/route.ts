import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createCashfreeOrder } from "@/lib/cashfree"
import { createPurchaseOrder, getPurchaseOrderByOrderId } from "@/lib/db"
import { getPlanById, getAdTypeById, getDesignServicePrice } from "@/lib/products"
import { getCreditPackById, getCreditPackPrice } from "@/lib/credit-packs"
import { getPlanByTier, getPlanPrice } from "@/lib/plans"
import { writeUsageEvent } from "@/lib/usage"

type OrderKind = "subscription" | "credit_pack" | "ad" | "ad_free" | "design_request"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      planId,
      adType,
      couponCode,
      useCredits,
      currency = "INR",
      cycle = "monthly",
      kind: kindRaw,
      creditPackId,
      requestId,
    } = body as {
      planId?: string
      adType?: string
      couponCode?: string
      useCredits?: boolean
      currency?: "INR"
      cycle?: "monthly" | "annual"
      kind?: OrderKind
      creditPackId?: string
      requestId?: string
    }

    const kind: OrderKind = kindRaw ?? (creditPackId ? "credit_pack" : "subscription")
    const email = session.user.email
    const name = session.user.name ?? ""
    const ts = Date.now()

    if (kind === "ad_free") {
      const orderId = `cf_adfree_${ts}`
      const cfOrder = await createCashfreeOrder({
        orderId,
        amount: 99,
        customerEmail: email,
        customerName: name,
        notes: { paymentType: "ad_free" },
      })
      await createPurchaseOrder({
        orderId,
        email,
        planId: "ad_free",
        kind: "ad_free",
        provider: "cashfree" as "razorpay",
        amount: 99,
        currency: "INR",
        status: "created",
        paymentId: null,
        couponCode: null,
        couponDiscount: 0,
        referralDiscount: 0,
        creditDiscount: 0,
        finalAmount: 99,
        appliedReferralCode: null,
        referrerEmail: null,
      })
      return NextResponse.json({ orderId, paymentSessionId: cfOrder.payment_session_id, kind: "ad_free" })
    }

    if (kind === "credit_pack") {
      if (!creditPackId) return NextResponse.json({ error: "creditPackId required" }, { status: 400 })
      const pack = getCreditPackById(creditPackId)
      if (!pack) return NextResponse.json({ error: "Invalid credit pack" }, { status: 400 })
      const price = getCreditPackPrice(pack, "IN")
      if (price.amount <= 0) return NextResponse.json({ error: "Pack pricing unavailable" }, { status: 400 })

      const orderId = `cf_pack_${creditPackId}_${ts}`
      const cfOrder = await createCashfreeOrder({
        orderId,
        amount: price.amount,
        customerEmail: email,
        customerName: name,
        notes: { paymentType: "credit_pack", creditPackId, credits: String(pack.credits) },
      })
      await createPurchaseOrder({
        orderId,
        email,
        planId: creditPackId,
        kind: "credit_pack",
        creditPackId,
        creditAmount: pack.credits,
        provider: "cashfree" as "razorpay",
        amount: price.amount,
        currency: "INR",
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
      await writeUsageEvent(email, "checkout_started", { kind: "credit_pack", creditPackId, credits: pack.credits })
      return NextResponse.json({ orderId, paymentSessionId: cfOrder.payment_session_id, kind: "credit_pack", creditPackId, credits: pack.credits })
    }

    if (kind === "ad") {
      if (!adType) return NextResponse.json({ error: "Ad type required" }, { status: 400 })
      const adTypeConfig = getAdTypeById(adType)
      if (!adTypeConfig) return NextResponse.json({ error: "Invalid ad type" }, { status: 400 })
      if (adTypeConfig.pricing.IN.amount <= 0) return NextResponse.json({ error: "Ad type not available for purchase" }, { status: 400 })

      const orderId = `cf_ad_${adType}_${ts}`
      const cfOrder = await createCashfreeOrder({
        orderId,
        amount: adTypeConfig.pricing.IN.amount,
        customerEmail: email,
        customerName: name,
        notes: { paymentType: "advertisement", adType },
      })
      await createPurchaseOrder({
        orderId,
        email,
        planId: adType,
        kind: "ad",
        provider: "cashfree" as "razorpay",
        amount: adTypeConfig.pricing.IN.amount,
        currency: "INR",
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
      return NextResponse.json({ orderId, paymentSessionId: cfOrder.payment_session_id, kind: "ad", adType })
    }

    if (kind === "design_request") {
      if (!adType || !requestId) return NextResponse.json({ error: "adType and requestId required" }, { status: 400 })
      const pricing = getDesignServicePrice(adType, "IN")
      if (!pricing) return NextResponse.json({ error: "Invalid ad type" }, { status: 400 })

      const orderId = `cf_design_${adType}_${ts}`
      const cfOrder = await createCashfreeOrder({
        orderId,
        amount: pricing.amount,
        customerEmail: email,
        customerName: name,
        notes: { paymentType: "design_request", adType, requestId },
      })
      await createPurchaseOrder({
        orderId,
        email,
        planId: `design_${adType}`,
        kind: "ad",
        provider: "cashfree" as "razorpay",
        amount: pricing.amount,
        currency: "INR",
        status: "created",
        paymentId: null,
        couponCode: null,
        couponDiscount: 0,
        referralDiscount: 0,
        creditDiscount: 0,
        finalAmount: pricing.amount,
        appliedReferralCode: null,
        referrerEmail: null,
      })
      return NextResponse.json({ orderId, paymentSessionId: cfOrder.payment_session_id, kind: "design_request", requestId })
    }

    // subscription
    if (!planId) return NextResponse.json({ error: "Plan ID required" }, { status: 400 })
    const plan = getPlanById(planId)
    if (!plan) return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    if (plan.pricing.IN.amount <= 0) return NextResponse.json({ error: "Plan not available for purchase" }, { status: 400 })

    const tierPlan = getPlanByTier(plan.id)
    const billingCycle: "monthly" | "annual" = cycle === "annual" ? "annual" : "monthly"
    const planPrice = tierPlan ? getPlanPrice(tierPlan, "IN", billingCycle) : { amount: plan.pricing.IN.amount, currency: "INR" as const }

    const quoteRes = await fetch(
      new URL("/api/checkout/quote", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
      {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie: request.headers.get("cookie") || "" },
        body: JSON.stringify({ planId, couponCode: couponCode || undefined, useCredits: !!useCredits, currency, cycle: billingCycle }),
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

    const orderId = `cf_sub_${planId}_${ts}`
    const cfOrder = await createCashfreeOrder({
      orderId,
      amount: quote.finalAmount,
      customerEmail: email,
      customerName: name,
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
      orderId,
      email,
      planId,
      kind: "subscription",
      billingCycle,
      provider: "cashfree" as "razorpay",
      amount: quote.baseAmount,
      currency: "INR",
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

    await writeUsageEvent(email, "checkout_started", { kind: "subscription", planId, cycle: billingCycle, finalAmount: quote.finalAmount })

    return NextResponse.json({
      orderId,
      paymentSessionId: cfOrder.payment_session_id,
      kind: "subscription",
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
    console.error("Cashfree order error:", error)
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}
