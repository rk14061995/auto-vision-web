import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getUsersList, getUsersCount } from "@/lib/db"

async function checkAdmin() {
  const session = await auth()
  if (!session?.user?.email) return null
  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim())
  if (!adminEmails.includes(session.user.email)) return null
  return session
}

export async function GET(request: Request) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { searchParams } = new URL(request.url)
  const skip = parseInt(searchParams.get("skip") || "0")
  const limit = parseInt(searchParams.get("limit") || "100")
  const countryRaw = searchParams.get("country")
  const country = countryRaw === "IN" || countryRaw === "US" ? countryRaw : undefined
  const [users, total] = await Promise.all([getUsersList(skip, limit, country), getUsersCount(country)])
  return NextResponse.json({ users, total })
}
