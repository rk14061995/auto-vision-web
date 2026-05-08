import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getCarCatalogList, createCarCatalog, makeCarSlug } from "@/lib/db"

async function requireAdmin(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) return { error: "Unauthorized", status: 401 }
  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim())
  if (!adminEmails.includes(session.user.email)) return { error: "Forbidden", status: 403 }
  return { email: session.user.email }
}

export async function GET(req: NextRequest) {
  const check = await requireAdmin(req)
  if ("error" in check) return NextResponse.json({ error: check.error }, { status: check.status })

  try {
    const cars = await getCarCatalogList(false)
    return NextResponse.json({ success: true, cars })
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const check = await requireAdmin(req)
  if ("error" in check) return NextResponse.json({ error: check.error }, { status: check.status })

  try {
    const body = await req.json()
    const { make, model, year, thumbnailUrl, model3dUrl, images2d, accessoryIds, isActive } = body

    if (!make || !model) {
      return NextResponse.json({ error: "make and model are required" }, { status: 400 })
    }

    const slug = makeCarSlug(make, model)
    const car = await createCarCatalog({
      make: make.trim(),
      model: model.trim(),
      year: year?.trim() || "",
      slug,
      thumbnailUrl: thumbnailUrl || "",
      model3dUrl: model3dUrl || "",
      images2d: images2d || [],
      accessoryIds: accessoryIds || [],
      isActive: isActive !== false,
    })

    return NextResponse.json({ success: true, car }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 })
  }
}
