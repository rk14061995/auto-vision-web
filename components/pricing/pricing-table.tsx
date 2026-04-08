"use client"

import { useEffect, useState } from "react"
import { PLANS } from "@/lib/products"
import { type Country } from "@/lib/geo"
import { CountrySelector } from "./country-selector"
import { PricingCard } from "./pricing-card"

export function PricingTable() {
  const [country, setCountry] = useState<Country>("IN")
  const [isLoading, setIsLoading] = useState(true)

  // Auto-detect country on mount
  useEffect(() => {
    async function detectCountry() {
      try {
        const res = await fetch("/api/geo")
        const data = await res.json()
        if (data.country === "IN" || data.country === "US") {
          setCountry(data.country)
        }
      } catch {
        // Default to India if detection fails
      } finally {
        setIsLoading(false)
      }
    }
    detectCountry()
  }, [])

  // Show first 5 plans (skip enterprise for grid), show enterprise separately
  const gridPlans = PLANS.slice(0, 5)
  const enterprisePlan = PLANS.find((p) => p.id === "business")

  return (
    <div className="space-y-12">
      {/* Country Selector */}
      <div className="flex justify-center">
        {isLoading ? (
          <div className="h-10 w-64 animate-pulse rounded-full bg-secondary" />
        ) : (
          <CountrySelector country={country} onChange={setCountry} />
        )}
      </div>

      {/* Pricing Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {gridPlans.map((plan) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            country={country}
            isHighlighted={plan.badge === "popular"}
          />
        ))}
      </div>

      {/* Enterprise Plan */}
      {enterprisePlan && (
        <div className="mx-auto max-w-2xl">
          <div className="rounded-xl border border-border/50 bg-card/50 p-8">
            <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
              <div>
                <h3 className="text-xl font-semibold">{enterprisePlan.name}</h3>
                <p className="mt-1 text-muted-foreground">
                  {enterprisePlan.description}
                </p>
                <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
                  {enterprisePlan.features.slice(0, 4).map((feature) => (
                    <li
                      key={feature}
                      className="text-sm text-muted-foreground"
                    >
                      • {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <a
                href="#contact"
                className="inline-flex h-10 shrink-0 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
