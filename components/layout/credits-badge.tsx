"use client"

import Link from "next/link"
import { Zap } from "lucide-react"
import { useSession } from "next-auth/react"

export function CreditsBadge() {
  const { data: session } = useSession()
  if (!session?.user) return null
  const monthly = session.user.aiCreditsMonthly ?? 0
  const purchased = session.user.aiCreditsPurchased ?? 0
  const total = monthly + purchased
  return (
    <Link
      href="/dashboard?tab=credits"
      className="hidden items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground sm:inline-flex"
      title="AI credits"
    >
      <Zap className="h-3.5 w-3.5 text-primary" />
      <span>{total}</span>
    </Link>
  )
}
