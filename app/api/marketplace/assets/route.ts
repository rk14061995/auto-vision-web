import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createAsset, listPublicAssets } from "@/lib/marketplace"
import type { MarketplaceAssetType } from "@/lib/db"

export async function GET(request: NextRequest) {
  const url = request.nextUrl
  const type = url.searchParams.get("type") as MarketplaceAssetType | null
  const limit = Number(url.searchParams.get("limit")) || 24
  const skip = Number(url.searchParams.get("skip")) || 0
  const assets = await listPublicAssets({
    type: type ?? undefined,
    limit,
    skip,
  })
  return NextResponse.json({ assets })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const body = await request.json().catch(() => ({}))
  const { type, title, description, thumbnailUrl, assetUrl, premium, priceIN, priceUS, tags } =
    body as {
      type?: MarketplaceAssetType
      title?: string
      description?: string
      thumbnailUrl?: string
      assetUrl?: string
      premium?: boolean
      priceIN?: number
      priceUS?: number
      tags?: string[]
    }
  if (!type || !title || !description || !thumbnailUrl || !assetUrl) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }
  const asset = await createAsset({
    creatorEmail: session.user.email,
    type,
    title,
    description,
    thumbnailUrl,
    assetUrl,
    premium,
    priceIN,
    priceUS,
    tags,
  })
  return NextResponse.json({ asset })
}
