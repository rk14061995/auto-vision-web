import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getUserRevenueDetail } from "@/lib/admin-revenue"

async function checkAdmin() {
  const session = await auth()
  if (!session?.user?.email) return null
  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim())
  if (!adminEmails.includes(session.user.email)) return null
  return session
}

export async function GET(_request: Request, ctx: { params: Promise<{ email: string }> }) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { email } = await ctx.params
  const decoded = decodeURIComponent(email)
  const detail = await getUserRevenueDetail(decoded)
  if (!detail.user && detail.orders.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json(detail)
}
