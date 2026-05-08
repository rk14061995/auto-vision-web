// Bridge module. The redesigned monetization system lives in lib/plans.ts.
// This file keeps the legacy `Plan`/`PLANS`/`getPlanById` exports alive so
// older callers don't break, plus continues to own the unrelated AD_TYPES
// catalog used by the marketing-ad feature.

import {
  CREATOR_PLAN,
  ENTERPRISE_PLAN,
  FREE_PLAN,
  PLAN_BY_TIER,
  PRO_PLAN,
  STUDIO_PLAN,
  type Plan as TierPlan,
} from "./plans"

export interface Plan {
  id: string
  name: string
  description: string
  projectLimit: number
  pricing: {
    IN: { amount: number; currency: "INR" }
    US: { amount: number; currency: "USD"; lemonSqueezyVariantId: string }
  }
  features: string[]
  badge?: "popular" | "best-value"
  isMonthly: boolean
}

function tierToLegacyPlan(plan: TierPlan): Plan {
  return {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    projectLimit: plan.projectLimit,
    pricing: {
      IN: { amount: plan.pricing.IN.amount, currency: "INR" },
      US: {
        amount: plan.pricing.US.amount,
        currency: "USD",
        lemonSqueezyVariantId: plan.pricing.US.lemonSqueezyVariantId ?? "",
      },
    },
    features: plan.highlights,
    badge: plan.badge,
    isMonthly: true,
  }
}

const TIER_PLANS: Plan[] = [
  tierToLegacyPlan(FREE_PLAN),
  tierToLegacyPlan(CREATOR_PLAN),
  tierToLegacyPlan(PRO_PLAN),
  tierToLegacyPlan(STUDIO_PLAN),
  tierToLegacyPlan(ENTERPRISE_PLAN),
]

const LEGACY_ID_TO_TIER: Record<string, keyof typeof PLAN_BY_TIER> = {
  "1-project": "creator",
  "5-projects": "creator",
  "50-projects": "pro",
  "100-projects": "studio",
  business: "enterprise",
}

export const PLANS: Plan[] = TIER_PLANS

export function getPlanById(id: string): Plan | undefined {
  // Direct match against the new tier ids.
  const direct = TIER_PLANS.find((p) => p.id === id)
  if (direct) return direct
  // Legacy id passthrough -> map to new tier.
  const mappedTier = LEGACY_ID_TO_TIER[id]
  if (mappedTier) {
    return TIER_PLANS.find((p) => p.id === mappedTier)
  }
  return undefined
}

export interface AdType {
  id: string
  name: string
  description: string
  duration: number // in days
  pricing: {
    IN: { amount: number; currency: "INR" }
    US: { amount: number; currency: "USD" }
  }
  dimensions: string
  maxImages: number
}

export const AD_TYPES: AdType[] = [
  {
    id: "banner",
    name: "Banner Ad",
    description: "Horizontal banner displayed at the top of pages",
    duration: 30,
    pricing: {
      IN: { amount: 50, currency: "INR" },
      US: { amount: 1, currency: "USD" },
    },
    dimensions: "728x90px",
    maxImages: 1,
  },
  {
    id: "horizontal",
    name: "Horizontal Ad",
    description: "Wide horizontal advertisement for better visibility",
    duration: 30,
    pricing: {
      IN: { amount: 70, currency: "INR" },
      US: { amount: 1.5, currency: "USD" },
    },
    dimensions: "970x250px",
    maxImages: 1,
  },
  {
    id: "square",
    name: "Square Ad",
    description: "Square advertisement for sidebar placement",
    duration: 30,
    pricing: {
      IN: { amount: 60, currency: "INR" },
      US: { amount: 1.2, currency: "USD" },
    },
    dimensions: "300x300px",
    maxImages: 1,
  },
  {
    id: "video",
    name: "Video Ad",
    description: "Short video advertisement with auto-play",
    duration: 30,
    pricing: {
      IN: { amount: 100, currency: "INR" },
      US: { amount: 2, currency: "USD" },
    },
    dimensions: "16:9 aspect ratio",
    maxImages: 1,
  },
]

export function getAdTypeById(id: string): AdType | undefined {
  return AD_TYPES.find((ad) => ad.id === id)
}

export function formatPrice(amount: number, currency: "INR" | "USD"): string {
  if (amount === -1) return "Contact Sales"
  if (amount === 0) return "Free"

  const formatter = new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

  return formatter.format(amount)
}
