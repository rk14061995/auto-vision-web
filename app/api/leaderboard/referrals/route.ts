import { NextRequest, NextResponse } from "next/server"
import { getReferralLeaderboard } from "@/lib/referrals"

export async function GET(request: NextRequest) {
  const limitParam = request.nextUrl.searchParams.get("limit")
  const limit = Math.max(1, Math.min(50, Number(limitParam) || 10))
  const leaders = await getReferralLeaderboard(limit)
  return NextResponse.json({ leaders })
}
