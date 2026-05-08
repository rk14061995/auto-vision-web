import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { deleteAsset, getAssetById, updateAsset } from "@/lib/marketplace"

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  const asset = await getAssetById(id)
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (asset.status !== "approved") {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim())
    if (!adminEmails.includes(session.user.email) && asset.creatorEmail !== session.user.email) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
  }
  return NextResponse.json({ asset })
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await context.params
  const asset = await getAssetById(id)
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (asset.creatorEmail !== session.user.email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const patch = await request.json().catch(() => ({}))
  const updated = await updateAsset(id, {
    title: patch.title,
    description: patch.description,
    thumbnailUrl: patch.thumbnailUrl,
    assetUrl: patch.assetUrl,
    premium: patch.premium,
    priceIN: patch.priceIN,
    priceUS: patch.priceUS,
    tags: patch.tags,
    status: "pending", // re-moderation after edit
  })
  return NextResponse.json({ asset: updated })
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await context.params
  const asset = await getAssetById(id)
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim())
  const isAdmin = adminEmails.includes(session.user.email)
  if (!isAdmin && asset.creatorEmail !== session.user.email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  await deleteAsset(id)
  return NextResponse.json({ success: true })
}
