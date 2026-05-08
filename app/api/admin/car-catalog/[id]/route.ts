import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getCarCatalogById, updateCarCatalog, deleteCarCatalog, makeCarSlug } from "@/lib/db"

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

  const car = await getCarCatalogById(params.id)
  if (!car) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ success: true, car })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const check = await requireAdmin(req)
  if ("error" in check) return NextResponse.json({ error: check.error }, { status: check.status })

  try {
    const body = await req.json()
    const { make, model, year, thumbnailUrl, model3dUrl, images2d, accessoryIds, isActive } = body

    const updates: Record<string, unknown> = {
      year: year?.trim() || "",
      thumbnailUrl: thumbnailUrl || "",
      model3dUrl: model3dUrl || "",
      images2d: images2d || [],
      accessoryIds: accessoryIds || [],
      isActive: isActive !== false,
    }

    if (make) updates.make = make.trim()
    if (model) updates.model = model.trim()
    if (make && model) updates.slug = makeCarSlug(make, model)

    const car = await updateCarCatalog(params.id, updates)
    if (!car) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ success: true, car })
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const check = await requireAdmin(req)
  if ("error" in check) return NextResponse.json({ error: check.error }, { status: check.status })

  await deleteCarCatalog(params.id)
  return NextResponse.json({ success: true })
}
