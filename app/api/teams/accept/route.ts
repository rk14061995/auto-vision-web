import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { acceptInvite } from "@/lib/teams"
import { writeUsageEvent } from "@/lib/usage"

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const body = await request.json().catch(() => ({}))
  const token = body?.token as string | undefined
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 })
  const result = await acceptInvite(token, session.user.email)
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 400 })
  }
  await writeUsageEvent(session.user.email, "team_member_joined", {
    teamId: result.team?._id?.toString(),
  })
  return NextResponse.json({ success: true, team: result.team })
}
