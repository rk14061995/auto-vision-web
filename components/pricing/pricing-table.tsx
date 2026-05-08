"use client"

import { useEffect, useState } from "react"
import {
  CREATOR_PLAN,
  ENTERPRISE_PLAN,
  FREE_PLAN,
  PRO_PLAN,
  STUDIO_PLAN,
} from "@/lib/plans"
import type { BillingCycle } from "@/lib/db"
import { type Country } from "@/lib/geo"
import { CountrySelector } from "./country-selector"
import { PlanCardV2 } from "./plan-card-v2"
import { BillingCycleToggle } from "./billing-cycle-toggle"
import { ComparisonMatrix } from "./comparison-matrix"
import { CreditPacksGrid } from "./credit-packs-grid"
import { trackPricingView } from "@/lib/gtag"

const GRID_PLANS = [FREE_PLAN, CREATOR_PLAN, PRO_PLAN, STUDIO_PLAN]

export function PricingTable() {
  const [country, setCountry] = useState<Country>("IN")
  const [cycle, setCycle] = useState<BillingCycle>("monthly")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function detect() {
      try {
        const res = await fetch("/api/geo")
        const data = await res.json()
        if (!cancelled && (data.country === "IN" || data.country === "US")) {
          setCountry(data.country)
        }
      } catch {
        // ignore — default IN
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    detect()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    trackPricingView()
  }, [])

  return (
    <div className="space-y-12">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6">
        {isLoading ? (
          <div className="h-10 w-64 animate-pulse rounded-full bg-secondary" />
        ) : (
          <CountrySelector country={country} onChange={setCountry} />
        )}
        <BillingCycleToggle cycle={cycle} onChange={setCycle} />
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {GRID_PLANS.map((plan) => (
          <PlanCardV2
            key={plan.id}
            plan={plan}
            country={country}
            cycle={cycle}
            highlighted={plan.badge === "popular"}
          />
        ))}
      </div>

      <CreditPacksGrid country={country} />

      <div className="mx-auto max-w-2xl rounded-2xl border border-border/50 bg-card/40 p-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold">{ENTERPRISE_PLAN.name}</h3>
            <p className="mt-1 text-muted-foreground">
              {ENTERPRISE_PLAN.description}
            </p>
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
              {ENTERPRISE_PLAN.highlights.map((feature) => (
                <li key={feature} className="text-sm text-muted-foreground">
                  • {feature}
                </li>
              ))}
            </ul>
          </div>
          <a
            href="mailto:sales@autovision.pro?subject=Enterprise%20interest"
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Contact Sales
          </a>
        </div>
      </div>

      <div>
        <h2 className="text-center text-2xl font-bold sm:text-3xl">
          Compare every feature
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Side-by-side breakdown across all tiers.
        </p>
        <div className="mt-8">
          <ComparisonMatrix
            plans={[FREE_PLAN, CREATOR_PLAN, PRO_PLAN, STUDIO_PLAN, ENTERPRISE_PLAN]}
          />
        </div>
      </div>
    </div>
  )
}
