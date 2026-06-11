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
    US: {
      amount: number
      currency: "USD"
      paypalPlanId: string
      // paddlePriceId: string           // DISABLED — replaced by PayPal
      // lemonSqueezyVariantId: string   // DISABLED
    }
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
        paypalPlanId: plan.pricing.US.paypalPlanId ?? "",
        // paddlePriceId: plan.pricing.US.paddlePriceId ?? "",
        // lemonSqueezyVariantId: plan.pricing.US.lemonSqueezyVariantId ?? "",
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
  supportsVideo: boolean
}

export const AD_TYPES: AdType[] = [
  {
    id: "banner",
    name: "Banner Ad",
    description: "Image-only banner shown across the platform",
    duration: 30,
    pricing: {
      IN: { amount: 99, currency: "INR" },
      US: { amount: 40, currency: "USD" },
    },
    dimensions: "1200x300px",
    maxImages: 1,
    supportsVideo: false,
  },
  {
    id: "vertical_basic",
    name: "Vertical Ad — Basic",
    description: "Image + video vertical ad, 7-day placement",
    duration: 7,
    pricing: {
      IN: { amount: 100, currency: "INR" },
      US: { amount: 35, currency: "USD" },
    },
    dimensions: "400x700px",
    maxImages: 3,
    supportsVideo: true,
  },
  {
    id: "vertical_premium",
    name: "Vertical Ad — Premium",
    description: "Image + video vertical ad, 30-day placement",
    duration: 30,
    pricing: {
      IN: { amount: 499, currency: "INR" },
      US: { amount: 99, currency: "USD" },
    },
    dimensions: "400x700px",
    maxImages: 3,
    supportsVideo: true,
  },
  {
    id: "landing_hero",
    name: "Landing Page Hero Ad",
    description: "Premium banner featured on the public landing page — maximum visibility, 30-day placement",
    duration: 30,
    pricing: {
      IN: { amount: 9999, currency: "INR" },
      US: { amount: 250, currency: "USD" },
    },
    dimensions: "1200x400px",
    maxImages: 1,
    supportsVideo: false,
  },
]

export type DesignAdType = "banner" | "vertical_basic" | "vertical_premium" | "landing_hero"

export const DESIGN_SERVICE_PRICES: Record<
  DesignAdType,
  { IN: { amount: number; currency: "INR" }; US: { amount: number; currency: "USD" } }
> = {
  banner:           { IN: { amount: 199,  currency: "INR" }, US: { amount: 20, currency: "USD" } },
  vertical_basic:   { IN: { amount: 499,  currency: "INR" }, US: { amount: 30, currency: "USD" } },
  vertical_premium: { IN: { amount: 1499, currency: "INR" }, US: { amount: 45, currency: "USD" } },
  landing_hero:     { IN: { amount: 1999, currency: "INR" }, US: { amount: 75, currency: "USD" } },
}

export function getDesignServicePrice(adType: string, country: "IN" | "US") {
  const prices = DESIGN_SERVICE_PRICES[adType as DesignAdType]
  return prices ? prices[country] : null
}

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
