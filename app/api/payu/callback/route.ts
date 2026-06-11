import { NextResponse } from "next/server"
import { verifyPayUResponse } from "@/lib/payu"
import {
  getPurchaseOrderByOrderId,
  markPurchaseOrderPaid,
  markWebhookProcessed,
  isWebhookProcessed,
  applyPlanPurchase,
  updateAdvertisement,
  updateDesignRequest,
  getAdvertisementsByEmail,
} from "@/lib/db"
import { grant as grantAiCredits } from "@/lib/credits"
import { writeUsageEvent } from "@/lib/usage"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

function redirect(path: string) {
  return NextResponse.redirect(`${APP_URL}${path}`, 303)
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const get = (k: string) => (formData.get(k) as string | null) ?? ""

    const status = get("status")
    const txnid = get("txnid")
    const mihpayid = get("mihpayid")  // PayU's payment ID
    const amount = get("amount")
    const productinfo = get("productinfo")
    const firstname = get("firstname")
    const email = get("email")
    const hash = get("hash")
    const udf1 = get("udf1")
    const udf2 = get("udf2")
    const udf3 = get("udf3")
    const udf4 = get("udf4")
    const udf5 = get("udf5")

    if (!txnid || !hash) {
      return redirect("/dashboard?payment=failed&reason=invalid_callback")
    }

    // Verify hash
    const valid = verifyPayUResponse({ txnid, amount, productinfo, firstname, email, status, hash, udf1, udf2, udf3, udf4, udf5 })
    if (!valid) {
      return redirect("/dashboard?payment=failed&reason=invalid_signature")
    }

    if (status !== "success") {
      return redirect("/dashboard?payment=failed")
    }

    // Idempotency
    if (await isWebhookProcessed("payu", mihpayid)) {
      return redirect("/dashboard?payment=success")
    }

    const order = await getPurchaseOrderByOrderId(txnid)
    if (!order) {
      return redirect("/dashboard?payment=failed&reason=order_not_found")
    }

    const kind = udf1 || order.kind || "subscription"

    if (kind === "ad") {
      const ads = await getAdvertisementsByEmail(email)
      const pendingAd = ads.find((ad) => ad.status === "pending" && ad.email === email)
      if (pendingAd) {
        await updateAdvertisement(pendingAd._id?.toString() || "", {
          status: "active",
          paymentId: mihpayid,
        })
      }
      await markPurchaseOrderPaid(txnid, mihpayid)
      await markWebhookProcessed("payu", mihpayid, "ad_paid")
      return redirect("/dashboard?payment=success&kind=ad")
    }

    if (kind === "design_request") {
      const rid = udf3 || order.planId?.replace("design_", "")
      if (rid) {
        await updateDesignRequest(rid, { status: "paid", paymentId: mihpayid })
      }
      await markPurchaseOrderPaid(txnid, mihpayid)
      await markWebhookProcessed("payu", mihpayid, "design_request_paid")
      return redirect("/dashboard?payment=success&kind=design_request&tab=design-service")
    }

    if (kind === "credit_pack") {
      const credits = order.creditAmount ?? Number(udf5) ?? 0
      if (credits > 0) {
        await grantAiCredits(email, {
          amount: credits,
          source: "credit_pack",
          metadata: { orderId: txnid, packId: order.creditPackId ?? udf2 },
        })
      }
      await markPurchaseOrderPaid(txnid, mihpayid)
      await markWebhookProcessed("payu", mihpayid, "credit_pack_paid")
      await writeUsageEvent(email, "credit_pack_purchased", { orderId: txnid, credits })
      return redirect("/dashboard?payment=success&kind=credit_pack")
    }

    // subscription
    const billingCycle = (udf4 || order.billingCycle || "monthly") as "monthly" | "annual"
    await applyPlanPurchase(email, order.planId, mihpayid, { provider: "payu", cycle: billingCycle })
    await markPurchaseOrderPaid(txnid, mihpayid)
    await markWebhookProcessed("payu", mihpayid, "subscription_paid")
    await writeUsageEvent(email, "checkout_completed", { kind: "subscription", planId: order.planId, orderId: txnid })
    return redirect("/dashboard?payment=success&kind=subscription")

  } catch (error) {
    console.error("PayU callback error:", error)
    return redirect("/dashboard?payment=failed&reason=server_error")
  }
}
