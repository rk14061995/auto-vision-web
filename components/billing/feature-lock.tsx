"use client"

import { Lock } from "lucide-react"
import { useState, type ReactNode } from "react"
import type { Feature } from "@/lib/feature-flags"
import { minimumTierFor } from "@/lib/feature-flags"
import { UpgradeModal, type UpgradeTrigger } from "./upgrade-modal"

interface FeatureLockProps {
  /** Logical capability name. Determines the upsell tier. */
  feature: Feature
  /** Whether the user actually has access. If true, just renders children. */
  allowed: boolean
  /** Trigger label for analytics + modal copy. */
  trigger?: UpgradeTrigger
  children: ReactNode
}

/**
 * Wraps a premium UI affordance. When `allowed` is false, intercepts clicks,
 * dims content, and shows the upgrade modal targeted at the minimum tier
 * needed for the feature.
 */
export function FeatureLock({
  feature,
  allowed,
  trigger = "manual",
  children,
}: FeatureLockProps) {
  const [open, setOpen] = useState(false)
  if (allowed) return <>{children}</>

  const recommendedTier = minimumTierFor(feature)

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setOpen(true)
        }}
        className="relative cursor-pointer"
      >
        <div className="pointer-events-none opacity-50 grayscale">{children}</div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="inline-flex items-center gap-1 rounded-full bg-card/95 px-3 py-1 text-xs font-medium text-foreground shadow-md ring-1 ring-border">
            <Lock className="h-3 w-3" />
            Upgrade
          </span>
        </div>
      </div>
      <UpgradeModal
        open={open}
        onClose={() => setOpen(false)}
        trigger={trigger}
        recommendedTier={recommendedTier}
      />
    </>
  )
}
