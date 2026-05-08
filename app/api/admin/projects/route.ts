import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getCarProjectsAdminCount, getCarProjectsAdminQuery } from "@/lib/db"

async function checkAdmin() {
  const session = await auth()
  if (!session?.user?.email) return null
  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim())
  if (!adminEmails.includes(session.user.email)) return null
  return session
}

export async function GET(request: Request) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { searchParams } = new URL(request.url)
  const skip = parseInt(searchParams.get("skip") || "0")
  const limit = parseInt(searchParams.get("limit") || "100")
  const email = searchParams.get("email")?.trim() || undefined
  const [projects, total] = await Promise.all([
    getCarProjectsAdminQuery({ ownerEmail: email, skip, limit }),
    getCarProjectsAdminCount(email),
  ])
  return NextResponse.json({ projects, total })
}
