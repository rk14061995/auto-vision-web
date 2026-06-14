import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getCashfreeOrderStatus } from "@/lib/cashfree"
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
  updateDesignRequest,
  updateUser,
  getAdvertisementsByEmail,
} from "@/lib/db"
import { grant as grantAiCredits } from "@/lib/credits"
import { applyReferralRewards } from "@/lib/referrals"
import { writeUsageEvent } from "@/lib/usage"
import { sendPaymentSuccessEmail, sendCreditPackEmail } from "@/lib/email"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { orderId, requestId } = await request.json()
    if (!orderId) {
      return NextResponse.json({ error: "orderId required" }, { status: 400 })
    }

    const order = await getPurchaseOrderByOrderId(orderId)
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 })
    if (order.email !== session.user.email) return NextResponse.json({ error: "Order does not belong to user" }, { status: 403 })
    if (order.status !== "created") return NextResponse.json({ success: true, alreadyProcessed: true })

    // Verify payment status with Cashfree
    const cfOrder = await getCashfreeOrderStatus(orderId)
    if (cfOrder.order_status !== "PAID") {
      return NextResponse.json({ error: `Payment not completed (status: ${cfOrder.order_status})` }, { status: 402 })
    }

    const paymentId = `cf_${cfOrder.cf_order_id}`

    if (await isWebhookProcessed("razorpay", paymentId)) {
      return NextResponse.json({ success: true, alreadyProcessed: true })
    }

    const kind = order.kind ?? "subscription"
    const orderCurrency = order.currency

    if (kind === "ad_free") {
      await updateUser(session.user.email, { adFree: true })
      await markPurchaseOrderPaid(orderId, paymentId)
      await markWebhookProcessed("razorpay", paymentId, "ad_free_paid")
      await writeUsageEvent(session.user.email, "checkout_completed", { kind: "ad_free", orderId })
      sendPaymentSuccessEmail({
        name: session.user.name || session.user.email,
        email: session.user.email,
        planOrItem: "Ad-Free Upgrade",
        amount: (order.finalAmount / 100).toFixed(2),
        currency: order.currency || "INR",
        orderId,
        provider: "Cashfree",
        kind: "ad_free",
      }).catch(console.error)
      return NextResponse.json({ success: true, kind: "ad_free" })
    }

    if (kind === ("design_request" as string)) {
      const rid = requestId ?? order.planId?.replace("design_", "")
      if (rid) await updateDesignRequest(rid, { status: "paid", paymentId })
      await markPurchaseOrderPaid(orderId, paymentId)
      await markWebhookProcessed("razorpay", paymentId, "design_request_paid")
      return NextResponse.json({ success: true, kind: "design_request" })
    }

    if (kind === "ad") {
      const ads = await getAdvertisementsByEmail(session.user.email)
      const pendingAd = ads.find((ad) => ad.status === "pending" && ad.email === session.user.email)
      if (pendingAd) await updateAdvertisement(pendingAd._id?.toString() || "", { status: "active", paymentId })
      await markPurchaseOrderPaid(orderId, paymentId)
      await markWebhookProcessed("razorpay", paymentId, "ad_paid")
      sendPaymentSuccessEmail({
        name: session.user.name || session.user.email,
        email: session.user.email,
        planOrItem: order.planId || "Advertisement",
        amount: (order.finalAmount / 100).toFixed(2),
        currency: order.currency || "INR",
        orderId,
        provider: "Cashfree",
        kind: "ad",
      }).catch(console.error)
      return NextResponse.json({ success: true, kind: "ad" })
    }

    if (kind === "credit_pack") {
      const credits = order.creditAmount ?? 0
      if (credits > 0) {
        await grantAiCredits(session.user.email, {
          amount: credits,
          source: "credit_pack",
          metadata: { orderId, packId: order.creditPackId },
        })
      }
      await markPurchaseOrderPaid(orderId, paymentId)
      await markWebhookProcessed("razorpay", paymentId, "credit_pack_paid")
      await writeUsageEvent(session.user.email, "credit_pack_purchased", { orderId, packId: order.creditPackId, credits })
      await writeUsageEvent(session.user.email, "checkout_completed", { kind: "credit_pack", orderId })
      sendCreditPackEmail({
        name: session.user.name || session.user.email,
        email: session.user.email,
        credits,
        packName: order.planId || `${credits}-credit pack`,
        orderId,
        amount: (order.finalAmount / 100).toFixed(2),
        currency: order.currency || "INR",
      }).catch(console.error)
      return NextResponse.json({ success: true, kind: "credit_pack", credits })
    }

    // subscription
    const paidCountBefore = await getPaidPurchaseCountByEmail(session.user.email)
    const updatedUser = await applyPlanPurchase(session.user.email, order.planId, paymentId, {
      provider: "razorpay",
      cycle: order.billingCycle ?? "monthly",
    })
    if (!updatedUser) {
      return NextResponse.json({ error: "Failed to activate subscription" }, { status: 500 })
    }

    await markPurchaseOrderPaid(orderId, paymentId)

    if (order.couponCode && order.couponDiscount > 0) {
      await redeemCoupon({ code: order.couponCode, email: session.user.email, orderId, amountDiscounted: order.couponDiscount, currency: orderCurrency })
    }
    if (order.creditDiscount > 0) {
      await addUserCredit({ email: session.user.email, amount: -order.creditDiscount, currency: orderCurrency, type: "credit_spent", referenceOrderId: orderId })
    }

    await applyReferralRewards({
      orderId,
      newPaidUserEmail: session.user.email,
      appliedReferralCode: order.appliedReferralCode,
      referrerEmail: order.referrerEmail,
      currency: orderCurrency,
      paidCountBefore,
    })

    await markWebhookProcessed("razorpay", paymentId, "subscription_paid")
    await writeUsageEvent(session.user.email, "checkout_completed", { kind: "subscription", planId: order.planId, orderId })
    sendPaymentSuccessEmail({
      name: session.user.name || session.user.email,
      email: session.user.email,
      planOrItem: order.planId,
      amount: (order.finalAmount / 100).toFixed(2),
      currency: order.currency || "INR",
      orderId,
      provider: "Cashfree",
      kind: "subscription",
    }).catch(console.error)

    return NextResponse.json({ success: true, kind: "subscription" })
  } catch (error) {
    console.error("Cashfree verify error:", error)
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 })
  }
}
