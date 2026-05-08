import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { applyCancellation } from "@/lib/billing"

export async function POST() {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const updated = await applyCancellation(session.user.email)
  if (!updated) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }
  return NextResponse.json({
    success: true,
    pendingDowngradeTo: updated.pendingDowngradeTo,
    pendingDowngradeAt: updated.pendingDowngradeAt,
  })
}
