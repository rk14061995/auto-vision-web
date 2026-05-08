import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getUserByEmail, updateUser, deleteUser } from "@/lib/db"

async function checkAdmin() {
  const session = await auth()
  if (!session?.user?.email) return null
  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim())
  if (!adminEmails.includes(session.user.email)) return null
  return session
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ email: string }> }
) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { email } = await params
  const user = await getUserByEmail(decodeURIComponent(email))
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const { password: _, ...safeUser } = user as any
  return NextResponse.json(safeUser)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ email: string }> }
) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { email } = await params
  const updates = await request.json()
  delete updates.password
  const updated = await updateUser(decodeURIComponent(email), updates)
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const { password: _, ...safeUser } = updated as any
  return NextResponse.json(safeUser)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ email: string }> }
) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { email } = await params
  await deleteUser(decodeURIComponent(email))
  return NextResponse.json({ deleted: true })
}
