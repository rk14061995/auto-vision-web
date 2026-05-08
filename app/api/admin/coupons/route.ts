import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getDb, type Coupon } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Simple admin guard (in production, use proper roles)
  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",")
  if (!adminEmails.includes(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const db = await getDb()
  const coupons = await db.collection<Coupon>("coupons").find({}).sort({ createdAt: -1 }).toArray()
  return NextResponse.json(coupons)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",")
  if (!adminEmails.includes(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const {
    code,
    discountType,
    discountValue,
    currency,
    minAmount,
    maxUses,
    perUserLimit,
    startsAt,
    expiresAt,
  } = (await request.json()) as {
    code: string
    discountType: "percent" | "flat"
    discountValue: number
    currency: "INR" | "USD" | "ANY"
    minAmount?: number
    maxUses?: number
    perUserLimit?: number
    startsAt?: string
    expiresAt?: string
  }

  if (!code || !discountType || typeof discountValue !== "number" || !currency) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const db = await getDb()
  const existing = await db.collection<Coupon>("coupons").findOne({ code: code.toUpperCase() })
  if (existing) {
    return NextResponse.json({ error: "Coupon code already exists" }, { status: 409 })
  }

  const coupon: Omit<Coupon, "_id"> = {
    code: code.toUpperCase(),
    isActive: true,
    discountType,
    discountValue,
    currency,
    minAmount,
    maxUses,
    perUserLimit,
    startsAt: startsAt ? new Date(startsAt) : undefined,
    expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    usedCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const result = await db.collection<Coupon>("coupons").insertOne(coupon as Coupon)
  return NextResponse.json({ ...coupon, _id: result.insertedId }, { status: 201 })
}
