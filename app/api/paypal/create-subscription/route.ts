import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getPayPalAccessToken, getPayPalBaseUrl } from "@/lib/paypal"
import { getPlanByTier } from "@/lib/plans"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { planId } = await request.json()
  const tierPlan = getPlanByTier(planId)
  const paypalPlanId = tierPlan?.pricing.US.paypalPlanId

  if (!paypalPlanId) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
  }

  try {
    const accessToken = await getPayPalAccessToken()
    const res = await fetch(`${getPayPalBaseUrl()}/v1/billing/subscriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan_id: paypalPlanId,
        subscriber: { email_address: session.user.email },
        custom_id: session.user.email,
        application_context: {
          brand_name: "AutoVision Pro",
          locale: "en-US",
          shipping_preference: "NO_SHIPPING",
          user_action: "SUBSCRIBE_NOW",
          return_url: `${APP_URL}/api/paypal/subscription-success`,
          cancel_url: `${APP_URL}/checkout/${planId}?country=US&cancelled=true`,
        },
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      console.error("PayPal create subscription error:", err)
      return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 })
    }

    const data = await res.json()
    const approveUrl = data.links?.find((l: { rel: string }) => l.rel === "approve")?.href

    return NextResponse.json({ approveUrl, subscriptionId: data.id })
  } catch (err) {
    console.error("PayPal subscription error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
