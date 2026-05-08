import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import {
  getPaidPurchaseCountByEmail,
  getUserByEmail,
  getUserByReferralCode,
  validateCoupon,
} from "@/lib/db"
import { getPlanById } from "@/lib/products"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))

  const { planId, couponCode, useCredits, currency } = body as {
    planId?: string
    couponCode?: string
    useCredits?: boolean
    currency?: "INR" | "USD"
  }

  if (!planId || !currency || !["INR", "USD"].includes(currency)) {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 })
  }

  const plan = getPlanById(planId)
  if (!plan) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
  }

  const baseAmount = currency === "INR" ? plan.pricing.IN.amount : plan.pricing.US.amount
  const user = await getUserByEmail(session.user.email)
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  let couponDiscount = 0
  let appliedCouponCode: string | null = null

  if (couponCode) {
    const result = await validateCoupon({
      code: couponCode,
      email: session.user.email,
      amount: baseAmount,
      currency,
    })

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    couponDiscount = result.discount
    appliedCouponCode = result.coupon.code
  }

  const afterCoupon = Math.max(0, Number((baseAmount - couponDiscount).toFixed(2)))

  let referralDiscount = 0
  let appliedReferralCode: string | null = null
  let referrerEmail: string | null = null

  const paidCount = await getPaidPurchaseCountByEmail(session.user.email)
  if (paidCount === 0 && user.referredByCode) {
    const referrer = await getUserByReferralCode(user.referredByCode)
    if (referrer?.email && referrer.email !== session.user.email) {
      referralDiscount = Math.max(0, Number(((afterCoupon * 10) / 100).toFixed(2)))
      appliedReferralCode = user.referredByCode
      referrerEmail = referrer.email
    }
  }

  const afterReferral = Math.max(0, Number((afterCoupon - referralDiscount).toFixed(2)))

  let creditDiscount = 0
  if (useCredits) {
    const available = currency === "INR" ? user.creditBalanceINR : user.creditBalanceUSD
    creditDiscount = Math.max(0, Math.min(afterReferral, available))
    creditDiscount = Number(creditDiscount.toFixed(2))
  }

  const finalAmount = Math.max(0, Number((afterReferral - creditDiscount).toFixed(2)))

  return NextResponse.json({
    baseAmount,
    currency,
    couponCode: appliedCouponCode,
    couponDiscount,
    referralDiscount,
    creditDiscount,
    finalAmount,
    appliedReferralCode,
    referrerEmail,
  })
}
