import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { recordReferralPayout } from "@/lib/admin-revenue"
import type { ReferralPayoutMethod } from "@/lib/db"

async function checkAdmin() {
  const session = await auth()
  if (!session?.user?.email) return null
  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim())
  if (!adminEmails.includes(session.user.email)) return null
  return session
}

const VALID_METHODS: ReferralPayoutMethod[] = [
  "manual",
  "bank",
  "upi",
  "paypal",
  "credit_topup",
  "other",
]

export async function POST(request: Request) {
  const session = await checkAdmin()
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const referrerEmail = (body.referrerEmail as string | undefined)?.trim()
  const amount = Number(body.amount)
  const currency = body.currency as string | undefined
  const method = (body.method as string | undefined) ?? "manual"
  const reference = (body.reference as string | undefined)?.trim() || undefined
  const notes = (body.notes as string | undefined)?.trim() || undefined
  const rewardIdsCovered = Array.isArray(body.rewardIdsCovered)
    ? (body.rewardIdsCovered as unknown[]).filter((x): x is string => typeof x === "string")
    : undefined

  if (!referrerEmail) {
    return NextResponse.json({ error: "referrerEmail is required" }, { status: 400 })
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "amount must be a positive number" }, { status: 400 })
  }
  if (currency !== "INR" && currency !== "USD") {
    return NextResponse.json({ error: "currency must be INR or USD" }, { status: 400 })
  }
  if (!VALID_METHODS.includes(method as ReferralPayoutMethod)) {
    return NextResponse.json({ error: "invalid method" }, { status: 400 })
  }

  try {
    const payout = await recordReferralPayout({
      referrerEmail,
      amount,
      currency,
      method: method as ReferralPayoutMethod,
      reference,
      notes,
      rewardIdsCovered,
      paidBy: session.user!.email!,
    })
    return NextResponse.json({ payout })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to record payout"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
