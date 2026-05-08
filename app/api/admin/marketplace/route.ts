import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { listAllAssets, updateAssetStatus } from "@/lib/marketplace"
import type { MarketplaceAssetStatus } from "@/lib/db"

async function gateAdmin() {
  const session = await auth()
  if (!session?.user?.email) return null
  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim())
  if (!adminEmails.includes(session.user.email)) return null
  return session.user.email
}

export async function GET() {
  const admin = await gateAdmin()
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const assets = await listAllAssets()
  return NextResponse.json({ assets })
}

export async function PATCH(request: NextRequest) {
  const admin = await gateAdmin()
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id, status, reason } = (await request.json().catch(() => ({}))) as {
    id?: string
    status?: MarketplaceAssetStatus
    reason?: string
  }
  if (!id || !status) {
    return NextResponse.json({ error: "id and status required" }, { status: 400 })
  }
  const updated = await updateAssetStatus(id, status, reason)
  return NextResponse.json({ asset: updated })
}
