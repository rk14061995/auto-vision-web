import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getPurchaseOrderByOrderId } from "@/lib/db"

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ orderId: string }> },
) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { orderId } = await context.params
  const order = await getPurchaseOrderByOrderId(orderId)
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 })

  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim())
  const isAdmin = adminEmails.includes(session.user.email)
  if (!isAdmin && order.email !== session.user.email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json({
    invoice: {
      orderId: order.orderId,
      kind: order.kind ?? "subscription",
      planId: order.planId,
      billingCycle: order.billingCycle ?? null,
      provider: order.provider,
      status: order.status,
      amount: order.amount,
      currency: order.currency,
      finalAmount: order.finalAmount,
      couponCode: order.couponCode,
      couponDiscount: order.couponDiscount,
      referralDiscount: order.referralDiscount,
      creditDiscount: order.creditDiscount,
      paymentId: order.paymentId,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    },
  })
}
