import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createTeam, getTeamForUser } from "@/lib/teams"

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const data = await getTeamForUser(session.user.email)
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const body = await request.json().catch(() => ({}))
  const name = (body?.name as string | undefined)?.trim()
  if (!name) {
    return NextResponse.json({ error: "name required" }, { status: 400 })
  }
  try {
    const team = await createTeam(session.user.email, name)
    if (!team) return NextResponse.json({ error: "User not found" }, { status: 404 })
    return NextResponse.json({ team })
  } catch (err) {
    const msg = (err as Error).message
    if (msg === "studio_or_enterprise_required") {
      return NextResponse.json(
        {
          error: "Studio or Enterprise plan required to create a team",
          code: "studio_or_enterprise_required",
        },
        { status: 402 },
      )
    }
    console.error("[teams] create failed:", err)
    return NextResponse.json({ error: "Failed to create team" }, { status: 500 })
  }
}
