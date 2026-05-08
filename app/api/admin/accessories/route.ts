import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getAccessoriesList, createAccessory } from "@/lib/db"

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
    const accessories = await getAccessoriesList(false)
    return NextResponse.json({ success: true, accessories })
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const check = await requireAdmin(req)
  if ("error" in check) return NextResponse.json({ error: check.error }, { status: check.status })

  try {
    const body = await req.json()
    const { name, category, accessoryType, model3dUrl, image2dUrl, thumbnailUrl, defaultPosition3d, isActive } = body

    if (!name || !category) {
      return NextResponse.json({ error: "name and category are required" }, { status: 400 })
    }

    const accessory = await createAccessory({
      name: name.trim(),
      category: category.trim(),
      accessoryType: accessoryType || "both",
      model3dUrl: model3dUrl || "",
      image2dUrl: image2dUrl || "",
      thumbnailUrl: thumbnailUrl || "",
      defaultPosition3d: defaultPosition3d || [0, 1.5, -1.8],
      isActive: isActive !== false,
    })

    return NextResponse.json({ success: true, accessory }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 })
  }
}
