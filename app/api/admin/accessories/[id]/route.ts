import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getAccessoryById, updateAccessory, deleteAccessory } from "@/lib/db"

async function requireAdmin(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) return { error: "Unauthorized", status: 401 }
  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim())
  if (!adminEmails.includes(session.user.email)) return { error: "Forbidden", status: 403 }
  return { email: session.user.email }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const check = await requireAdmin(req)
  if ("error" in check) return NextResponse.json({ error: check.error }, { status: check.status })

  const accessory = await getAccessoryById(params.id)
  if (!accessory) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ success: true, accessory })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const check = await requireAdmin(req)
  if ("error" in check) return NextResponse.json({ error: check.error }, { status: check.status })

  try {
    const body = await req.json()
    const { name, category, accessoryType, model3dUrl, image2dUrl, thumbnailUrl, defaultPosition3d, isActive } = body

    const updates: Record<string, unknown> = {
      accessoryType: accessoryType || "both",
      model3dUrl: model3dUrl || "",
      image2dUrl: image2dUrl || "",
      thumbnailUrl: thumbnailUrl || "",
      defaultPosition3d: defaultPosition3d || [0, 1.5, -1.8],
      isActive: isActive !== false,
    }
    if (name) updates.name = name.trim()
    if (category) updates.category = category.trim()

    const accessory = await updateAccessory(params.id, updates)
    if (!accessory) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ success: true, accessory })
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const check = await requireAdmin(req)
  if ("error" in check) return NextResponse.json({ error: check.error }, { status: check.status })

  await deleteAccessory(params.id)
  return NextResponse.json({ success: true })
}
