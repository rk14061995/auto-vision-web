import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { updateDesignRequest } from "@/lib/db"

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim())

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const { status, resultImageUrl } = body as {
    status?: "in_progress" | "completed"
    resultImageUrl?: string
  }

  const updated = await updateDesignRequest(id, {
    ...(status && { status }),
    ...(resultImageUrl && { resultImageUrl }),
  })

  if (!updated) return NextResponse.json({ error: "Request not found" }, { status: 404 })
  return NextResponse.json(updated)
}
