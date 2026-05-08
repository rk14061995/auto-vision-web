import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import {
  createTemplateDrop,
  deleteTemplateDrop,
  listAllTemplates,
  updateTemplateDrop,
} from "@/lib/templates"

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
  const templates = await listAllTemplates()
  return NextResponse.json({ templates })
}

export async function POST(request: NextRequest) {
  const admin = await gateAdmin()
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const body = await request.json().catch(() => ({}))
  const { title, description, thumbnailUrl, assetUrl, tags, isActive, publishedAt } = body as {
    title?: string
    description?: string
    thumbnailUrl?: string
    assetUrl?: string
    tags?: string[]
    isActive?: boolean
    publishedAt?: string
  }
  if (!title || !description || !thumbnailUrl || !assetUrl) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }
  const drop = await createTemplateDrop({
    title,
    description,
    thumbnailUrl,
    assetUrl,
    tags: tags ?? [],
    isActive: isActive ?? true,
    publishedAt: publishedAt ? new Date(publishedAt) : undefined,
  })
  return NextResponse.json({ drop })
}

export async function PATCH(request: NextRequest) {
  const admin = await gateAdmin()
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const body = await request.json().catch(() => ({}))
  const { id, ...patch } = body as { id?: string } & Record<string, unknown>
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  const drop = await updateTemplateDrop(id, patch as Record<string, never>)
  return NextResponse.json({ drop })
}

export async function DELETE(request: NextRequest) {
  const admin = await gateAdmin()
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = (await request.json().catch(() => ({}))) as { id?: string }
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  await deleteTemplateDrop(id)
  return NextResponse.json({ success: true })
}
