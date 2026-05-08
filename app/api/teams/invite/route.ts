import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getUserByEmail } from "@/lib/db"
import { inviteMember } from "@/lib/teams"
import { writeUsageEvent } from "@/lib/usage"
import type { TeamRole } from "@/lib/db"

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const email = (body?.email as string | undefined)?.toLowerCase().trim()
  const role = (body?.role as TeamRole | undefined) ?? "member"
  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 })
  }

  const user = await getUserByEmail(session.user.email)
  if (!user?.teamId) {
    return NextResponse.json({ error: "No team" }, { status: 400 })
  }
  if (user.teamRole !== "owner" && user.teamRole !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const invite = await inviteMember({
      teamId: user.teamId,
      email,
      invitedBy: session.user.email,
      role,
    })
    await writeUsageEvent(session.user.email, "team_invite_sent", { email, role })

    const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/team/invite/${invite.token}`
    // Email sending is out of scope (no provider configured); surface the URL
    // so the inviter can share it manually.
    return NextResponse.json({
      success: true,
      acceptUrl,
      invite: {
        token: invite.token,
        email: invite.email,
        role: invite.role,
        expiresAt: invite.expiresAt,
      },
    })
  } catch (err) {
    const msg = (err as Error).message
    if (msg === "seats_exhausted") {
      return NextResponse.json({ error: "All seats are taken" }, { status: 402 })
    }
    if (msg === "team_not_found") {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }
    console.error("[teams/invite] failed:", err)
    return NextResponse.json({ error: "Failed to invite" }, { status: 500 })
  }
}
