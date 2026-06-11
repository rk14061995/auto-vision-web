import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getBalance, listTransactions } from "@/lib/credits"
import { getUserByEmail } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [balance, user] = await Promise.all([
    getBalance(session.user.email),
    getUserByEmail(session.user.email),
  ])
  if (!balance) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const transactions = await listTransactions(session.user.email, 30)

  return NextResponse.json({ balance, transactions, adFree: user?.adFree ?? false })
}
