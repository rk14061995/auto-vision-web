import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getPayPalAccessToken, getPayPalBaseUrl } from "@/lib/paypal"
import { getCreditPackById } from "@/lib/credit-packs"
import { getAdTypeById, getDesignServicePrice } from "@/lib/products"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { kind, creditPackId, adType: adTypeId, pendingAdId, requestId } = body

  let amount: string
  let description: string
  let returnPath: string

  if (kind === "credit_pack") {
    const pack = getCreditPackById(creditPackId)
    if (!pack) return NextResponse.json({ error: "Invalid credit pack" }, { status: 400 })
    amount = pack.pricing.US.amount.toFixed(2)
    description = `${pack.credits} AI credits`
    returnPath = `/api/paypal/order-success?kind=credit_pack&creditPackId=${creditPackId}`
  } else if (kind === "ad") {
    const ad = getAdTypeById(adTypeId)
    if (!ad) return NextResponse.json({ error: "Invalid ad type" }, { status: 400 })
    amount = ad.pricing.US.amount.toFixed(2)
    description = `${ad.name} advertisement (${ad.duration} days)`
    returnPath = `/api/paypal/order-success?kind=ad&adType=${adTypeId}${pendingAdId ? `&pendingAdId=${pendingAdId}` : ""}`
  } else if (kind === "design_request") {
    const pricing = getDesignServicePrice(adTypeId, "US")
    if (!pricing) return NextResponse.json({ error: "Invalid ad type" }, { status: 400 })
    amount = pricing.amount.toFixed(2)
    description = `Ad creative design service — ${(adTypeId as string).replace(/_/g, " ")}`
    returnPath = `/api/paypal/order-success?kind=design_request&adType=${adTypeId}&requestId=${requestId ?? ""}`
  } else if (kind === "ad_free") {
    amount = "19.00"
    description = "Ad-free experience — one-time"
    returnPath = `/api/paypal/order-success?kind=ad_free`
  } else {
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 })
  }

  try {
    const accessToken = await getPayPalAccessToken()
    const res = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: { currency_code: "USD", value: amount },
            description,
            custom_id: session.user.email,
          },
        ],
        application_context: {
          brand_name: "AutoVision Pro",
          shipping_preference: "NO_SHIPPING",
          user_action: "PAY_NOW",
          return_url: `${APP_URL}${returnPath}`,
          cancel_url: `${APP_URL}/dashboard?payment=cancelled`,
        },
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      console.error("PayPal create order error:", err)
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
    }

    const data = await res.json()
    const approveUrl = data.links?.find((l: { rel: string }) => l.rel === "approve")?.href

    return NextResponse.json({ approveUrl, orderId: data.id })
  } catch (err) {
    console.error("PayPal order error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
