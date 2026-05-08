import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getCreditPackById } from "@/lib/credit-packs"

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const creditPackId = body?.creditPackId as string | undefined
  const currency = (body?.currency as "INR" | "USD" | undefined) ?? (session.user.country === "US" ? "USD" : "INR")
  if (!creditPackId) {
    return NextResponse.json({ error: "creditPackId required" }, { status: 400 })
  }

  const pack = getCreditPackById(creditPackId)
  if (!pack) {
    return NextResponse.json({ error: "Invalid credit pack" }, { status: 400 })
  }

  // Delegate to the Razorpay order route to create the order and persist
  // PurchaseOrder with kind=credit_pack. The verify route will grant credits
  // when payment succeeds.
  const orderRes = await fetch(
    new URL("/api/razorpay/order", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: request.headers.get("cookie") || "",
      },
      body: JSON.stringify({ kind: "credit_pack", creditPackId, currency }),
    },
  )

  const data = await orderRes.json()
  return NextResponse.json(data, { status: orderRes.status })
}
