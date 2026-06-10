import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import {
  applyPlanPurchase,
  getPaidPurchaseCountByEmail,
  getUserByEmail,
  isWebhookProcessed,
  markWebhookProcessed,
  updateUser,
} from "@/lib/db"
import {
  getPayPalAccessToken,
  getPayPalBaseUrl,
  mapPayPalPlanIdToTier,
} from "@/lib/paypal"
import { applyReferralRewards } from "@/lib/referrals"
import { writeUsageEvent } from "@/lib/usage"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const subscriptionId = searchParams.get("subscription_id")

  if (!subscriptionId) {
    redirect("/dashboard?payment=failed")
  }

  const session = await auth()
  if (!session?.user?.email) {
    redirect(`/login?redirect=/api/paypal/subscription-success?subscription_id=${subscriptionId}`)
  }

  const userEmail = session.user.email

  try {
    // Idempotency — skip if already processed (e.g. webhook fired first)
    if (await isWebhookProcessed("paypal", subscriptionId)) {
      redirect("/dashboard?payment=success")
    }

    // Fetch subscription details from PayPal
    const accessToken = await getPayPalAccessToken()
    const res = await fetch(
      `${getPayPalBaseUrl()}/v1/billing/subscriptions/${subscriptionId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    )

    if (!res.ok) {
      redirect("/dashboard?payment=failed")
    }

    const sub = await res.json()

    if (sub.status !== "ACTIVE" && sub.status !== "APPROVAL_PENDING") {
      redirect("/dashboard?payment=failed")
    }

    const paypalPlanId: string = sub.plan_id
    const { planType, projectLimit } = mapPayPalPlanIdToTier(paypalPlanId)

    if (planType === "free") {
      redirect("/dashboard?payment=failed")
    }

    const nextBilling: Date | null = sub.billing_info?.next_billing_time
      ? new Date(sub.billing_info.next_billing_time)
      : null

    const paidCountBefore = await getPaidPurchaseCountByEmail(userEmail)

    await applyPlanPurchase(userEmail, planType, subscriptionId, {
      provider: "paypal",
      cycle: "monthly",
    })

    await updateUser(userEmail, {
      paypalSubscriptionId: subscriptionId,
      planTier: planType,
      planType,
      projectLimit,
      subscriptionExpiry: nextBilling,
      dunning: false,
    })

    const userRecord = await getUserByEmail(userEmail)
    await applyReferralRewards({
      orderId: subscriptionId,
      newPaidUserEmail: userEmail,
      appliedReferralCode: userRecord?.referredByCode ?? null,
      referrerEmail: null,
      currency: "USD",
      paidCountBefore,
    })

    await writeUsageEvent(userEmail, "checkout_completed", {
      kind: "subscription",
      provider: "paypal",
      subscriptionId,
      paypalPlanId,
    })

    await markWebhookProcessed("paypal", subscriptionId, "BILLING.SUBSCRIPTION.ACTIVATED")
  } catch (err) {
    console.error("PayPal subscription-success error:", err)
    redirect("/dashboard?payment=failed")
  }

  redirect("/dashboard?payment=success")
}
