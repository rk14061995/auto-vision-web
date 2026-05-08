import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getDb, type ReferralMilestone, type User } from "@/lib/db"
import { REFERRAL_MILESTONES } from "@/lib/referrals-config"

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const db = await getDb()
  const user = await db
    .collection<User>("users")
    .findOne({ email: session.user.email })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const referralLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/signup?ref=${encodeURIComponent(
    user.referralCode || "",
  )}`

  const [referredCount, totalRewards, milestones] = await Promise.all([
    db.collection<User>("users").countDocuments({ referredByCode: user.referralCode }),
    db.collection("referral_rewards").countDocuments({ referrerEmail: session.user.email }),
    db
      .collection<ReferralMilestone>("referral_milestones")
      .find({ email: session.user.email })
      .sort({ achievedAt: -1 })
      .toArray(),
  ])

  const milestoneIds = new Set(milestones.map((m) => m.milestoneId))
  const milestoneProgress = REFERRAL_MILESTONES.map((m) => ({
    id: m.id,
    label: m.label,
    threshold: m.threshold,
    bonusCredits: m.bonusCredits,
    achieved: milestoneIds.has(m.id),
    progress: Math.min(1, referredCount / m.threshold),
  }))

  return NextResponse.json({
    referralCode: user.referralCode,
    referralLink,
    referredCount,
    rewardsCount: totalRewards,
    creditBalanceINR: user.creditBalanceINR,
    creditBalanceUSD: user.creditBalanceUSD,
    milestones: milestoneProgress,
  })
}
