import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getUserByEmail, type TeamBrandKit } from "@/lib/db"
import { updateBrandKit } from "@/lib/teams"

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const user = await getUserByEmail(session.user.email)
  if (!user?.teamId) return NextResponse.json({ error: "No team" }, { status: 400 })
  if (user.teamRole !== "owner" && user.teamRole !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const brandKit = (await request.json().catch(() => ({}))) as TeamBrandKit
  const team = await updateBrandKit(user.teamId, brandKit)
  return NextResponse.json({ team })
}
