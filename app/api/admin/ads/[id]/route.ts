import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { updateAdvertisement, getDb, type Advertisement } from "@/lib/db"
import { ObjectId } from "mongodb"

async function checkAdmin() {
  const session = await auth()
  if (!session?.user?.email) return null
  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim())
  if (!adminEmails.includes(session.user.email)) return null
  return session
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params
  const updates = await request.json()
  const updated = await updateAdvertisement(id, updates)
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(updated)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  const db = await getDb()
  await db.collection<Advertisement>("advertisements").deleteOne({ _id: new ObjectId(id) })
  return NextResponse.json({ deleted: true })
}
