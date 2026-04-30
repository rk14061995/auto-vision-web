import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getDb, type User } from "@/lib/db"

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
    user.referralCode || ""
  )}`

  const referredCount = await db
    .collection<User>("users")
    .countDocuments({ referredByCode: user.referralCode })

  const totalRewards = await db
    .collection("referral_rewards")
    .countDocuments({ referrerEmail: session.user.email })

  return NextResponse.json({
    referralCode: user.referralCode,
    referralLink,
    referredCount,
    rewardsCount: totalRewards,
    creditBalanceINR: user.creditBalanceINR,
    creditBalanceUSD: user.creditBalanceUSD,
  })
}
