import { NextRequest, NextResponse } from "next/server"
import { getDb, type AICreditTransaction, type User } from "@/lib/db"
import { PLAN_BY_TIER } from "@/lib/plans"
import { resolveTier } from "@/lib/feature-flags"

/**
 * Resets the aiCreditsMonthly bucket for any user whose aiCreditsResetAt has
 * elapsed. The credits-tab also lazy-resets, but this endpoint backfills users
 * who haven't logged in recently. Authenticated via Vercel Cron header or
 * CRON_SECRET bearer token.
 */
export async function POST(request: NextRequest) {
  const isVercelCron = request.headers.get("x-vercel-cron") === "1"
  const auth = request.headers.get("authorization") ?? ""
  const expected = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : null
  const isCronSecret = !!expected && auth === expected

  if (!isVercelCron && !isCronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const db = await getDb()
    const now = new Date()
    const users = await db
      .collection<User>("users")
      .find({ aiCreditsResetAt: { $lte: now } })
      .toArray()

    let reset = 0
    for (const user of users) {
      const tier = resolveTier(user)
      const monthly = PLAN_BY_TIER[tier].monthlyAiCredits
      const nextReset = new Date(now)
      nextReset.setMonth(nextReset.getMonth() + 1)
      await db.collection<User>("users").updateOne(
        { email: user.email },
        {
          $set: {
            aiCreditsMonthly: monthly,
            aiCreditsResetAt: nextReset,
            updatedAt: now,
          },
        },
      )
      await db.collection<AICreditTransaction>("ai_credit_transactions").insertOne({
        email: user.email,
        feature: "monthly_reset",
        cost: 0,
        bucket: "monthly",
        balanceBefore: {
          monthly: user.aiCreditsMonthly ?? 0,
          purchased: user.aiCreditsPurchased ?? 0,
        },
        balanceAfter: {
          monthly,
          purchased: user.aiCreditsPurchased ?? 0,
        },
        status: "granted",
        createdAt: now,
      })
      reset += 1
    }

    return NextResponse.json({ success: true, reset })
  } catch (err) {
    console.error("[cron/reset-monthly-credits] failed:", err)
    return NextResponse.json({ error: "Cron failed" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}
