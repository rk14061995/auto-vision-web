import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { applyUpgrade } from "@/lib/billing"
import type { PlanTier, BillingCycle } from "@/lib/db"

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const { planId, cycle } = body as { planId?: PlanTier; cycle?: BillingCycle }

  if (!planId || !["free", "creator", "pro", "studio", "enterprise"].includes(planId)) {
    return NextResponse.json({ error: "Invalid plan id" }, { status: 400 })
  }
  const billingCycle: BillingCycle = cycle === "annual" ? "annual" : "monthly"

  const result = await applyUpgrade({
    email: session.user.email,
    newTier: planId,
    cycle: billingCycle,
  })

  if (result.needsPayment) {
    // Frontend will redirect to /checkout/[planId]?cycle=...
    return NextResponse.json({
      applied: false,
      needsPayment: true,
      proration: result.proration,
      checkoutUrl: `/checkout/${planId}?cycle=${billingCycle}`,
    })
  }

  return NextResponse.json({
    applied: true,
    needsPayment: false,
    proration: result.proration,
  })
}
