"use client"

import Link from "next/link"
import { Sparkles, X } from "lucide-react"
import { useEffect } from "react"
import type { PlanTier } from "@/lib/db"
import { PLAN_BY_TIER, formatPlanPrice } from "@/lib/plans"
import { trackUpgradeIntent } from "@/lib/gtag"

export type UpgradeTrigger =
  | "project_limit"
  | "4k_export"
  | "remove_watermark"
  | "premium_asset"
  | "ai_credits"
  | "team_collab"
  | "version_history"
  | "commercial_license"
  | "manual"

interface UpgradeModalProps {
  open: boolean
  onClose: () => void
  trigger: UpgradeTrigger
  recommendedTier: PlanTier
  country?: "IN" | "US"
}

const TRIGGER_COPY: Record<UpgradeTrigger, { title: string; subtitle: string }> = {
  project_limit: {
    title: "You've maxed out projects on this plan",
    subtitle: "Upgrade to keep building without losing momentum.",
  },
  "4k_export": {
    title: "4K exports are a Pro feature",
    subtitle: "Studio-quality renders for client presentations and print.",
  },
  remove_watermark: {
    title: "Lose the watermark",
    subtitle: "Creator and above export without the AutoVision logo.",
  },
  premium_asset: {
    title: "This is a Premium asset",
    subtitle: "Premium accessories and wraps unlock from Creator onwards.",
  },
  ai_credits: {
    title: "More AI credits, more variations",
    subtitle: "Pro and Studio plans bundle dramatically more AI usage.",
  },
  team_collab: {
    title: "Bring your team in",
    subtitle: "Studio plan adds 5 seats, brand kit, and approval workflow.",
  },
  version_history: {
    title: "See every revision",
    subtitle: "Pro unlocks unlimited version history and a private library.",
  },
  commercial_license: {
    title: "Use designs commercially",
    subtitle: "Pro and above include a commercial license for client work.",
  },
  manual: {
    title: "Upgrade your plan",
    subtitle: "Unlock the next tier of features.",
  },
}

export function UpgradeModal({
  open,
  onClose,
  trigger,
  recommendedTier,
  country = "IN",
}: UpgradeModalProps) {
  const plan = PLAN_BY_TIER[recommendedTier]

  useEffect(() => {
    if (open) {
      trackUpgradeIntent(recommendedTier, trigger)
    }
  }, [open, recommendedTier, trigger])

  if (!open) return null

  const monthlyPrice = plan.pricing[country].amount
  const monthlyText = formatPlanPrice(monthlyPrice, plan.pricing[country].currency)
  const copy = TRIGGER_COPY[trigger]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="h-3 w-3" />
          Recommended: {plan.name}
        </div>
        <h2 className="mt-3 text-xl font-semibold">{copy.title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{copy.subtitle}</p>
        <div className="mt-5 rounded-xl border border-border/50 bg-secondary/30 p-4">
          <p className="text-2xl font-bold">
            {monthlyText}
            <span className="text-sm font-normal text-muted-foreground">/mo</span>
          </p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {plan.highlights.slice(0, 4).map((feature) => (
              <li key={feature}>• {feature}</li>
            ))}
          </ul>
        </div>
        <div className="mt-6 flex gap-2">
          <Link
            href={`/checkout/${plan.id}`}
            onClick={onClose}
            className="flex-1 inline-flex h-10 items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Upgrade to {plan.name}
          </Link>
          <Link
            href="/pricing"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-secondary px-4 text-sm hover:bg-secondary/80"
          >
            Compare
          </Link>
        </div>
      </div>
    </div>
  )
}
