"use client"

import { Sparkles } from "lucide-react"
import type { BillingCycle } from "@/lib/db"
import { ANNUAL_DISCOUNT_MONTHS } from "@/lib/plans"

interface BillingCycleToggleProps {
  cycle: BillingCycle
  onChange: (cycle: BillingCycle) => void
}

export function BillingCycleToggle({ cycle, onChange }: BillingCycleToggleProps) {
  const savePct = Math.round((ANNUAL_DISCOUNT_MONTHS / 12) * 100)
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card/60 p-1 text-sm">
      <button
        type="button"
        onClick={() => onChange("monthly")}
        className={`rounded-full px-4 py-1.5 transition-colors ${
          cycle === "monthly"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Monthly
      </button>
      <button
        type="button"
        onClick={() => onChange("annual")}
        className={`flex items-center gap-2 rounded-full px-4 py-1.5 transition-colors ${
          cycle === "annual"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Annual
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
          <Sparkles className="h-3 w-3" />
          Save {savePct}%
        </span>
      </button>
    </div>
  )
}
