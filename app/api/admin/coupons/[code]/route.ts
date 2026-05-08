import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getDb, type Coupon } from "@/lib/db"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",")
  if (!adminEmails.includes(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { code } = await params
  const updates = (await request.json()) as Partial<Coupon>

  const db = await getDb()
  const result = await db
    .collection<Coupon>("coupons")
    .findOneAndUpdate(
      { code: code.toUpperCase() },
      { $set: { ...updates, updatedAt: new Date() } },
      { returnDocument: "after" }
    )

  if (!result) {
    return NextResponse.json({ error: "Coupon not found" }, { status: 404 })
  }

  return NextResponse.json(result)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",")
  if (!adminEmails.includes(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { code } = await params
  const db = await getDb()
  const result = await db.collection<Coupon>("coupons").deleteOne({ code: code.toUpperCase() })

  if (!result.acknowledged || result.deletedCount === 0) {
    return NextResponse.json({ error: "Coupon not found" }, { status: 404 })
  }

  return NextResponse.json({ deleted: true })
}
