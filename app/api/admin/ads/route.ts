import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getAllAdvertisements } from "@/lib/db"

async function checkAdmin() {
  const session = await auth()
  if (!session?.user?.email) return null
  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim())
  if (!adminEmails.includes(session.user.email)) return null
  return session
}

export async function GET() {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const ads = await getAllAdvertisements()
  return NextResponse.json(ads)
}
