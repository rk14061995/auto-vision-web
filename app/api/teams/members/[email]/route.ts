import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getUserByEmail } from "@/lib/db"
import { changeMemberRole, removeMember } from "@/lib/teams"
import type { TeamRole } from "@/lib/db"

async function gateOwnerOrAdmin(sessionEmail: string) {
  const user = await getUserByEmail(sessionEmail)
  if (!user?.teamId) return { ok: false as const, status: 400, error: "No team" }
  if (user.teamRole !== "owner" && user.teamRole !== "admin") {
    return { ok: false as const, status: 403, error: "Forbidden" }
  }
  return { ok: true as const, user }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ email: string }> },
) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const gate = await gateOwnerOrAdmin(session.user.email)
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  const { email } = await context.params
  const body = await request.json().catch(() => ({}))
  const role = body?.role as TeamRole | undefined
  if (!role || !["admin", "member"].includes(role)) {
    return NextResponse.json({ error: "invalid role" }, { status: 400 })
  }
  const member = await changeMemberRole(gate.user.teamId!, email, role)
  return NextResponse.json({ success: true, member })
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ email: string }> },
) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const gate = await gateOwnerOrAdmin(session.user.email)
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  const { email } = await context.params
  if (email === gate.user.email) {
    return NextResponse.json({ error: "owners cannot remove themselves" }, { status: 400 })
  }
  await removeMember(gate.user.teamId!, email)
  return NextResponse.json({ success: true })
}
