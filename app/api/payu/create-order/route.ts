import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import {
  generateTxnId,
  generatePayUHash,
  formatAmount,
  getPayUKey,
  PAYU_PAYMENT_URL,
  isPayUConfigured,
} from "@/lib/payu"
import { createPurchaseOrder } from "@/lib/db"
import { getAdTypeById, getDesignServicePrice } from "@/lib/products"
import { getCreditPackById, getCreditPackPrice } from "@/lib/credit-packs"
import { getPlanById } from "@/lib/products"
import { getPlanByTier, getPlanPrice } from "@/lib/plans"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!isPayUConfigured()) {
    return NextResponse.json({ error: "PayU not configured" }, { status: 503 })
  }

  try {
    const body = await request.json()
    const { kind, adType, planId, creditPackId, requestId, cycle = "monthly" } = body as {
      kind: "ad" | "subscription" | "credit_pack" | "design_request"
      adType?: string
      planId?: string
      creditPackId?: string
      requestId?: string
      cycle?: "monthly" | "annual"
    }

    const email = session.user.email
    const firstname = (session.user.name ?? email.split("@")[0]).split(" ")[0]
    const txnid = generateTxnId()

    let amountNum = 0
    let productinfo = "AutoVision Pro"
    let udf1 = kind
    let udf2 = ""
    let udf3 = ""
    let udf4 = ""
    let udf5 = ""

    // ── Determine amount and product info per kind ─────────────────────────
    if (kind === "ad") {
      if (!adType) return NextResponse.json({ error: "adType required" }, { status: 400 })
      const ad = getAdTypeById(adType)
      if (!ad) return NextResponse.json({ error: "Invalid ad type" }, { status: 400 })
      amountNum = ad.pricing.IN.amount
      productinfo = `AutoVision Pro — ${ad.name} (${ad.duration} days)`
      udf2 = adType

    } else if (kind === "design_request") {
      if (!adType || !requestId) return NextResponse.json({ error: "adType and requestId required" }, { status: 400 })
      const pricing = getDesignServicePrice(adType, "IN")
      if (!pricing) return NextResponse.json({ error: "Invalid ad type" }, { status: 400 })
      amountNum = pricing.amount
      productinfo = `AutoVision Pro — Ad Design Service (${adType.replace(/_/g, " ")})`
      udf2 = adType
      udf3 = requestId

    } else if (kind === "credit_pack") {
      if (!creditPackId) return NextResponse.json({ error: "creditPackId required" }, { status: 400 })
      const pack = getCreditPackById(creditPackId)
      if (!pack) return NextResponse.json({ error: "Invalid credit pack" }, { status: 400 })
      const price = getCreditPackPrice(pack, "IN")
      amountNum = price.amount
      productinfo = `AutoVision Pro — ${pack.credits} AI Credits`
      udf2 = creditPackId
      udf5 = String(pack.credits)

    } else if (kind === "subscription") {
      if (!planId) return NextResponse.json({ error: "planId required" }, { status: 400 })
      const plan = getPlanById(planId)
      if (!plan) return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
      const tierPlan = getPlanByTier(plan.id)
      const billingCycle: "monthly" | "annual" = cycle === "annual" ? "annual" : "monthly"
      const price = tierPlan
        ? getPlanPrice(tierPlan, "IN", billingCycle)
        : { amount: plan.pricing.IN.amount, currency: "INR" as const }
      amountNum = price.amount
      productinfo = `AutoVision Pro — ${plan.name} (${billingCycle})`
      udf2 = planId
      udf4 = billingCycle

    } else {
      return NextResponse.json({ error: "Invalid kind" }, { status: 400 })
    }

    if (amountNum <= 0) {
      return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 })
    }

    const amount = formatAmount(amountNum)

    const hash = generatePayUHash({ txnid, amount, productinfo, firstname, email, udf1, udf2, udf3, udf4, udf5 })

    // Store purchase order so the callback can look it up by txnid
    await createPurchaseOrder({
      orderId: txnid,
      email,
      planId: udf2 || kind,
      kind: kind === "design_request" ? "ad" as "ad" : kind === "ad" ? "ad" : kind === "credit_pack" ? "credit_pack" : "subscription",
      ...(kind === "credit_pack" && { creditPackId, creditAmount: Number(udf5) }),
      ...(kind === "subscription" && { billingCycle: udf4 as "monthly" | "annual" }),
      provider: "payu",
      amount: amountNum,
      currency: "INR",
      status: "created",
      paymentId: null,
      couponCode: null,
      couponDiscount: 0,
      referralDiscount: 0,
      creditDiscount: 0,
      finalAmount: amountNum,
      appliedReferralCode: null,
      referrerEmail: null,
    })

    return NextResponse.json({
      formUrl: PAYU_PAYMENT_URL,
      fields: {
        key: getPayUKey(),
        txnid,
        amount,
        productinfo,
        firstname,
        email,
        phone: "",
        surl: `${APP_URL}/api/payu/callback`,
        furl: `${APP_URL}/api/payu/callback`,
        hash,
        udf1,
        udf2,
        udf3,
        udf4,
        udf5,
      },
    })
  } catch (error) {
    console.error("PayU create-order error:", error)
    return NextResponse.json({ error: "Failed to create PayU order" }, { status: 500 })
  }
}
