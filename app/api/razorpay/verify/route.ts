import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import {
  addUserCredit,
  applyPlanPurchase,
  getPurchaseOrderByOrderId,
  getPaidPurchaseCountByEmail,
  isWebhookProcessed,
  markPurchaseOrderPaid,
  markWebhookProcessed,
  redeemCoupon,
  updateAdvertisement,
  getAdvertisementsByEmail,
} from "@/lib/db"
import { verifyRazorpaySignature } from "@/lib/razorpay"
import { grant as grantAiCredits } from "@/lib/credits"
import { applyReferralRewards } from "@/lib/referrals"
import { writeUsageEvent } from "@/lib/usage"

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
        { status: 400 },
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
      return NextResponse.json({ error: "Order already processed" }, { status: 409 })
    }

    const isValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    )
    if (!isValid) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 })
    }

    // Idempotency: if a previous verify call already processed this payment,
    // bail out gracefully.
    if (await isWebhookProcessed("razorpay", razorpay_payment_id)) {
      return NextResponse.json({ success: true, alreadyProcessed: true })
    }

    const kind = order.kind ?? "subscription"
    const orderCurrency = order.currency

    if (kind === "ad") {
      const ads = await getAdvertisementsByEmail(session.user.email)
      const pendingAd = ads.find(
        (ad) => ad.status === "pending" && ad.email === session.user.email,
      )
      if (pendingAd) {
        await updateAdvertisement(pendingAd._id?.toString() || "", {
          status: "active",
          paymentId: razorpay_payment_id,
        })
      }
      await markPurchaseOrderPaid(razorpay_order_id, razorpay_payment_id)
      await markWebhookProcessed("razorpay", razorpay_payment_id, "ad_paid")
      return NextResponse.json({ success: true, kind: "ad" })
    }

    if (kind === "credit_pack") {
      const credits = order.creditAmount ?? 0
      if (credits > 0) {
        await grantAiCredits(session.user.email, {
          amount: credits,
          source: "credit_pack",
          metadata: { orderId: razorpay_order_id, packId: order.creditPackId },
        })
      }
      await markPurchaseOrderPaid(razorpay_order_id, razorpay_payment_id)
      await markWebhookProcessed("razorpay", razorpay_payment_id, "credit_pack_paid")
      await writeUsageEvent(session.user.email, "credit_pack_purchased", {
        orderId: razorpay_order_id,
        packId: order.creditPackId,
        credits,
      })
      await writeUsageEvent(session.user.email, "checkout_completed", {
        kind: "credit_pack",
        orderId: razorpay_order_id,
      })
      return NextResponse.json({ success: true, kind: "credit_pack", credits })
    }

    // subscription kind.
    const paidCountBefore = await getPaidPurchaseCountByEmail(session.user.email)
    const updatedUser = await applyPlanPurchase(
      session.user.email,
      order.planId,
      razorpay_payment_id,
      { provider: "razorpay", cycle: order.billingCycle ?? "monthly" },
    )
    if (!updatedUser) {
      return NextResponse.json(
        { error: "Failed to activate subscription" },
        { status: 500 },
      )
    }

    await markPurchaseOrderPaid(razorpay_order_id, razorpay_payment_id)

    if (order.couponCode && order.couponDiscount > 0) {
      await redeemCoupon({
        code: order.couponCode,
        email: session.user.email,
        orderId: razorpay_order_id,
        amountDiscounted: order.couponDiscount,
        currency: orderCurrency,
      })
    }

    if (order.creditDiscount > 0) {
      await addUserCredit({
        email: session.user.email,
        amount: -order.creditDiscount,
        currency: orderCurrency,
        type: "credit_spent",
        referenceOrderId: razorpay_order_id,
      })
    }

    await applyReferralRewards({
      orderId: razorpay_order_id,
      newPaidUserEmail: session.user.email,
      appliedReferralCode: order.appliedReferralCode,
      referrerEmail: order.referrerEmail,
      currency: orderCurrency,
      paidCountBefore,
    })

    await markWebhookProcessed("razorpay", razorpay_payment_id, "subscription_paid")
    await writeUsageEvent(session.user.email, "checkout_completed", {
      kind: "subscription",
      planId: order.planId,
      orderId: razorpay_order_id,
    })

    return NextResponse.json({ success: true, kind: "subscription" })
  } catch (error) {
    console.error("Razorpay verify error:", error)
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 },
    )
  }
}
