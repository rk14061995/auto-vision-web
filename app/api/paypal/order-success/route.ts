import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getPayPalAccessToken, getPayPalBaseUrl } from "@/lib/paypal"
import {
  createPurchaseOrder,
  markPurchaseOrderPaid,
  isWebhookProcessed,
  markWebhookProcessed,
  updateAdvertisement,
  updateDesignRequest,
  updateUser,
} from "@/lib/db"
import { grant as grantAiCredits } from "@/lib/credits"
import { getCreditPackById } from "@/lib/credit-packs"
import { getAdTypeById } from "@/lib/products"
import { writeUsageEvent } from "@/lib/usage"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")       // PayPal order ID
  const kind = searchParams.get("kind")
  const creditPackId = searchParams.get("creditPackId") ?? ""
  const adTypeId = searchParams.get("adType") ?? ""
  const pendingAdId = searchParams.get("pendingAdId") ?? ""
  const requestId = searchParams.get("requestId") ?? ""

  if (!token || !kind) redirect("/dashboard?payment=failed")

  const session = await auth()
  if (!session?.user?.email) redirect("/login")
  const userEmail = session.user.email

  if (await isWebhookProcessed("paypal", token)) {
    redirect("/dashboard?payment=success")
  }

  try {
    // Capture the PayPal order
    const accessToken = await getPayPalAccessToken()
    const captureRes = await fetch(
      `${getPayPalBaseUrl()}/v2/checkout/orders/${token}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    )

    if (!captureRes.ok) {
      console.error("PayPal capture failed:", await captureRes.text())
      redirect("/dashboard?payment=failed")
    }

    const captured = await captureRes.json()
    const captureId =
      captured.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? token

    if (kind === "credit_pack") {
      const pack = getCreditPackById(creditPackId)
      if (!pack) redirect("/dashboard?payment=failed")

      const order = await createPurchaseOrder({
        orderId: token,
        email: userEmail,
        planId: creditPackId,
        kind: "credit_pack",
        creditPackId,
        creditAmount: pack!.credits,
        provider: "paypal",
        amount: pack!.pricing.US.amount,
        currency: "USD",
        status: "paid",
        paymentId: captureId,
        couponCode: null,
        couponDiscount: 0,
        referralDiscount: 0,
        creditDiscount: 0,
        finalAmount: pack!.pricing.US.amount,
        appliedReferralCode: null,
        referrerEmail: null,
      })

      await grantAiCredits(userEmail, {
        amount: pack!.credits,
        source: "credit_pack",
        metadata: { orderId: token, packId: creditPackId },
      })

      await markPurchaseOrderPaid(order.orderId, captureId)
      await writeUsageEvent(userEmail, "credit_pack_purchased", {
        orderId: token,
        packId: creditPackId,
        credits: pack!.credits,
        provider: "paypal",
      })
      await writeUsageEvent(userEmail, "checkout_completed", {
        kind: "credit_pack",
        orderId: token,
        provider: "paypal",
      })
    } else if (kind === "ad") {
      const adConfig = getAdTypeById(adTypeId)
      if (!adConfig) redirect("/dashboard?payment=failed")

      await createPurchaseOrder({
        orderId: token,
        email: userEmail,
        planId: adTypeId,
        kind: "ad",
        provider: "paypal",
        amount: adConfig!.pricing.US.amount,
        currency: "USD",
        status: "paid",
        paymentId: captureId,
        couponCode: null,
        couponDiscount: 0,
        referralDiscount: 0,
        creditDiscount: 0,
        finalAmount: adConfig!.pricing.US.amount,
        appliedReferralCode: null,
        referrerEmail: null,
      })

      // Activate the pending ad saved before the PayPal redirect
      if (pendingAdId) {
        await updateAdvertisement(pendingAdId, {
          status: "active",
          paymentId: captureId,
          paymentAmount: adConfig!.pricing.US.amount,
          paymentCurrency: "USD",
        })
      }

      await writeUsageEvent(userEmail, "checkout_completed", {
        kind: "ad",
        orderId: token,
        adType: adTypeId,
        provider: "paypal",
      })

      await markWebhookProcessed("paypal", token, "ad_paid")
      redirect("/dashboard?payment=success&tab=ads")
    } else if (kind === "design_request") {
      const { getDesignServicePrice } = await import("@/lib/products")
      const pricing = getDesignServicePrice(adTypeId, "US")
      if (!pricing) redirect("/dashboard?payment=failed")

      await createPurchaseOrder({
        orderId: token,
        email: userEmail,
        planId: `design_${adTypeId}`,
        kind: "ad" as "ad",
        provider: "paypal",
        amount: pricing!.amount,
        currency: "USD",
        status: "paid",
        paymentId: captureId,
        couponCode: null,
        couponDiscount: 0,
        referralDiscount: 0,
        creditDiscount: 0,
        finalAmount: pricing!.amount,
        appliedReferralCode: null,
        referrerEmail: null,
      })

      if (requestId) {
        await updateDesignRequest(requestId, { status: "paid", paymentId: captureId })
      }

      await markWebhookProcessed("paypal", token, "design_request_paid")
      redirect("/dashboard?payment=success&tab=design-service")
    } else if (kind === "ad_free") {
      await createPurchaseOrder({
        orderId: token,
        email: userEmail,
        planId: "ad_free",
        kind: "ad_free",
        provider: "paypal",
        amount: 19,
        currency: "USD",
        status: "paid",
        paymentId: captureId,
        couponCode: null,
        couponDiscount: 0,
        referralDiscount: 0,
        creditDiscount: 0,
        finalAmount: 19,
        appliedReferralCode: null,
        referrerEmail: null,
      })

      await updateUser(userEmail, { adFree: true })
      await markWebhookProcessed("paypal", token, "ad_free_paid")
      await writeUsageEvent(userEmail, "checkout_completed", {
        kind: "ad_free",
        orderId: token,
        provider: "paypal",
      })
      redirect("/dashboard?payment=success")
    }

    await markWebhookProcessed("paypal", token, `${kind}_paid`)
  } catch (err) {
    // Re-throw Next.js redirect/notFound — they are control flow, not errors
    if (err instanceof Error && (err as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) throw err
    console.error("PayPal order-success error:", err)
    redirect("/dashboard?payment=failed")
  }

  redirect("/dashboard?payment=success")
}
