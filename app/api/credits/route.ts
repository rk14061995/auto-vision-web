import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getBalance, listTransactions } from "@/lib/credits"

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const balance = await getBalance(session.user.email)
  if (!balance) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const transactions = await listTransactions(session.user.email, 30)

  return NextResponse.json({ balance, transactions })
}
