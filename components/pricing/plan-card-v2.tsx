"use client"

import Link from "next/link"
import { Check, Sparkles, Zap } from "lucide-react"
import type { BillingCycle } from "@/lib/db"
import {
  formatPlanPrice,
  getAnnualAmount,
  type Plan,
} from "@/lib/plans"
import {
  trackBeginCheckout,
  trackSelectItem,
  type GA4Item,
} from "@/lib/gtag"

interface PlanCardV2Props {
  plan: Plan
  country: "IN" | "US"
  cycle: BillingCycle
  highlighted?: boolean
}

export function PlanCardV2({ plan, country, cycle, highlighted }: PlanCardV2Props) {
  const monthlyAmount = plan.pricing[country].amount
  const isContact = monthlyAmount < 0
  const isFree = monthlyAmount === 0
  const annualAmount = getAnnualAmount(plan, country)
  const cycleAmount = cycle === "annual" ? annualAmount : monthlyAmount
  const currency = plan.pricing[country].currency

  const ga4Item: GA4Item = {
    item_id: plan.id,
    item_name: plan.name,
    item_category: "subscription",
    price: cycleAmount,
    currency,
    quantity: 1,
  }

  const ctaHref = isContact
    ? "/contact?plan=enterprise"
    : isFree
      ? "/signup"
      : `/checkout/${plan.id}?cycle=${cycle}`

  const ctaLabel = isContact ? "Contact Sales" : isFree ? "Start Free" : `Get ${plan.name}`

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-6 transition-shadow ${
        highlighted
          ? "border-primary bg-card shadow-lg shadow-primary/15"
          : "border-border/50 bg-card/50 hover:border-border"
      }`}
    >
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
              plan.badge === "popular"
                ? "bg-primary text-primary-foreground"
                : "bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/30"
            }`}
          >
            <Sparkles className="h-3 w-3" />
            {plan.badge === "popular" ? "Most Popular" : "Best Value"}
          </span>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold">{plan.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
      </div>

      <div className="mt-5">
        {isContact ? (
          <p className="text-3xl font-bold">Contact Sales</p>
        ) : (
          <>
            <p className="text-3xl font-bold">
              {formatPlanPrice(cycleAmount, currency)}
              {!isFree && (
                <span className="text-base font-normal text-muted-foreground">
                  {cycle === "annual" ? "/yr" : "/mo"}
                </span>
              )}
            </p>
            {!isFree && cycle === "annual" && (
              <p className="mt-1 text-xs text-muted-foreground">
                = {formatPlanPrice(Math.round(cycleAmount / 12), currency)} / month
              </p>
            )}
          </>
        )}
      </div>

      <div className="mt-5 inline-flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2 text-sm">
        <Zap className="h-4 w-4 text-primary" />
        <span>
          <span className="font-medium">{plan.monthlyAiCredits}</span> AI credits / month
        </span>
      </div>

      <ul className="mt-6 flex-1 space-y-3 text-sm">
        {plan.highlights.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span className="text-muted-foreground">{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        href={ctaHref}
        onClick={() => {
          trackSelectItem(ga4Item)
          if (!isFree && !isContact) trackBeginCheckout(ga4Item)
        }}
        className={`mt-6 inline-flex h-10 w-full items-center justify-center rounded-md text-sm font-medium transition-colors ${
          highlighted
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "border border-border/60 bg-secondary text-foreground hover:bg-secondary/80"
        }`}
      >
        {ctaLabel}
      </Link>
    </div>
  )
}
