import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getRevenuePerUser } from "@/lib/admin-revenue"

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
  const skip = parseInt(searchParams.get("skip") || "0", 10)
  const limit = parseInt(searchParams.get("limit") || "50", 10)
  const search = searchParams.get("search")?.trim() || undefined
  const sortByRaw = searchParams.get("sortBy") || "revenueINR"
  const sortBy = (["revenueINR", "revenueUSD", "ordersPaid", "lastPaidAt"] as const).includes(
    sortByRaw as never,
  )
    ? (sortByRaw as "revenueINR" | "revenueUSD" | "ordersPaid" | "lastPaidAt")
    : "revenueINR"

  const result = await getRevenuePerUser({ skip, limit, search, sortBy })
  return NextResponse.json(result)
}
