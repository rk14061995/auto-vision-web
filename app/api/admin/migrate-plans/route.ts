import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { migrateAllUsers } from "@/lib/migrate-plans"

export async function POST() {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim())
  if (!adminEmails.includes(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const result = await migrateAllUsers()
    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    console.error("[admin/migrate-plans] failed:", err)
    return NextResponse.json({ error: "Migration failed" }, { status: 500 })
  }
}
