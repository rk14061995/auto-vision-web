// New monetization plans. This file is the source of truth for the redesigned
// pricing system; lib/products.ts is kept for legacy callers but re-exports
// from here.

import type { PlanTier, BillingCycle } from "./db"

export type ExportResolution = "720p" | "1080p" | "4k" | "8k"

export interface PlanFeatures {
  watermark: boolean
  exportResolution: ExportResolution
  premiumAssets: boolean
  premiumWraps: boolean
  unlimitedRevisions: boolean
  backgroundRemoval: boolean
  aiTools: boolean
  aiWrapGeneration: boolean
  advancedLayers: boolean
  versionHistory: boolean
  privateAssetLibrary: boolean
  commercialLicense: boolean
  priorityRendering: boolean
  teamCollab: boolean
  whiteLabel: boolean
  clientApprovalWorkflow: boolean
  brandKit: boolean
  leadCapture: boolean
  apiAccess: boolean
  ssoIntegration: boolean
  dedicatedInfra: boolean
  prioritySupport: boolean
}

export interface PlanPriceRule {
  IN: { amount: number; currency: "INR" }
  US: { amount: number; currency: "USD"; lemonSqueezyVariantId?: string }
}

export interface Plan {
  id: PlanTier
  name: string
  tagline: string
  description: string
  /** -1 = unlimited */
  projectLimit: number
  monthlyAiCredits: number
  teamSeats: number
  features: PlanFeatures
  /** Monthly pricing in IN/US. Annual = monthly * 10 (2 months free) by default. */
  pricing: PlanPriceRule
  /** Optional override of annual amount; falls back to monthly * 10. */
  annualPricingOverride?: PlanPriceRule
  badge?: "popular" | "best-value"
  /** Whether the plan can be self-serve purchased. */
  isPurchasable: boolean
  /** Headline feature highlights for the pricing card. */
  highlights: string[]
}

export const ANNUAL_DISCOUNT_MONTHS = 2 // pay 10 months for 12 (~17% off)

export const FREE_PLAN: Plan = {
  id: "free",
  name: "Free",
  tagline: "Start designing in seconds",
  description: "Try the platform with no commitment. Great for first-time enthusiasts.",
  projectLimit: 3,
  monthlyAiCredits: 5,
  teamSeats: 1,
  features: {
    watermark: true,
    exportResolution: "720p",
    premiumAssets: false,
    premiumWraps: false,
    unlimitedRevisions: false,
    backgroundRemoval: false,
    aiTools: true, // limited by 5 monthly credits
    aiWrapGeneration: false,
    advancedLayers: false,
    versionHistory: false,
    privateAssetLibrary: false,
    commercialLicense: false,
    priorityRendering: false,
    teamCollab: false,
    whiteLabel: false,
    clientApprovalWorkflow: false,
    brandKit: false,
    leadCapture: false,
    apiAccess: false,
    ssoIntegration: false,
    dedicatedInfra: false,
    prioritySupport: false,
  },
  pricing: {
    IN: { amount: 0, currency: "INR" },
    US: { amount: 0, currency: "USD" },
  },
  isPurchasable: false,
  highlights: [
    "3 active projects",
    "Watermarked 720p export",
    "Community assets",
    "5 AI credits / month",
    "Public sharing",
  ],
}

export const CREATOR_PLAN: Plan = {
  id: "creator",
  name: "Creator",
  tagline: "For solo creators going pro",
  description: "Unlock HD exports, premium assets, and meaningful AI usage.",
  projectLimit: 15,
  monthlyAiCredits: 50,
  teamSeats: 1,
  features: {
    watermark: false,
    exportResolution: "1080p",
    premiumAssets: true,
    premiumWraps: true,
    unlimitedRevisions: true,
    backgroundRemoval: true,
    aiTools: true,
    aiWrapGeneration: false,
    advancedLayers: false,
    versionHistory: false,
    privateAssetLibrary: false,
    commercialLicense: false,
    priorityRendering: false,
    teamCollab: false,
    whiteLabel: false,
    clientApprovalWorkflow: false,
    brandKit: false,
    leadCapture: false,
    apiAccess: false,
    ssoIntegration: false,
    dedicatedInfra: false,
    prioritySupport: false,
  },
  pricing: {
    IN: { amount: 299, currency: "INR" },
    US: {
      amount: 9,
      currency: "USD",
      lemonSqueezyVariantId: process.env.LS_VARIANT_CREATOR ?? "1595234",
    },
  },
  isPurchasable: true,
  highlights: [
    "15 active projects",
    "HD 1080p exports, no watermark",
    "Premium accessories & wraps",
    "Background removal",
    "50 AI credits / month",
  ],
}

export const PRO_PLAN: Plan = {
  id: "pro",
  name: "Pro",
  tagline: "For pros, influencers, and creators who ship daily",
  description: "Unlimited projects, AI wraps, advanced editing, and 4K output.",
  projectLimit: -1,
  monthlyAiCredits: 250,
  teamSeats: 1,
  features: {
    watermark: false,
    exportResolution: "4k",
    premiumAssets: true,
    premiumWraps: true,
    unlimitedRevisions: true,
    backgroundRemoval: true,
    aiTools: true,
    aiWrapGeneration: true,
    advancedLayers: true,
    versionHistory: true,
    privateAssetLibrary: true,
    commercialLicense: true,
    priorityRendering: true,
    teamCollab: false,
    whiteLabel: false,
    clientApprovalWorkflow: false,
    brandKit: false,
    leadCapture: false,
    apiAccess: false,
    ssoIntegration: false,
    dedicatedInfra: false,
    prioritySupport: false,
  },
  pricing: {
    IN: { amount: 999, currency: "INR" },
    US: {
      amount: 24,
      currency: "USD",
      lemonSqueezyVariantId: process.env.LS_VARIANT_PRO ?? "lspro_placeholder",
    },
  },
  badge: "popular",
  isPurchasable: true,
  highlights: [
    "Unlimited projects",
    "4K exports + commercial license",
    "AI wrap generation",
    "Version history & private library",
    "250 AI credits / month",
  ],
}

export const STUDIO_PLAN: Plan = {
  id: "studio",
  name: "Studio",
  tagline: "For wrap shops, dealerships, and design teams",
  description:
    "Bring your team into a shared workspace with brand-kit, approval workflow, and white-label previews.",
  projectLimit: -1,
  monthlyAiCredits: 1000,
  teamSeats: 5,
  features: {
    watermark: false,
    exportResolution: "4k",
    premiumAssets: true,
    premiumWraps: true,
    unlimitedRevisions: true,
    backgroundRemoval: true,
    aiTools: true,
    aiWrapGeneration: true,
    advancedLayers: true,
    versionHistory: true,
    privateAssetLibrary: true,
    commercialLicense: true,
    priorityRendering: true,
    teamCollab: true,
    whiteLabel: true,
    clientApprovalWorkflow: true,
    brandKit: true,
    leadCapture: true,
    apiAccess: false,
    ssoIntegration: false,
    dedicatedInfra: false,
    prioritySupport: true,
  },
  pricing: {
    IN: { amount: 4999, currency: "INR" },
    US: {
      amount: 99,
      currency: "USD",
      lemonSqueezyVariantId: process.env.LS_VARIANT_STUDIO ?? "1595261",
    },
  },
  badge: "best-value",
  isPurchasable: true,
  highlights: [
    "5 team members + shared workspace",
    "Client approval workflow",
    "White-label previews & brand kit",
    "Lead capture forms",
    "1,000 AI credits / month",
  ],
}

export const ENTERPRISE_PLAN: Plan = {
  id: "enterprise",
  name: "Enterprise",
  tagline: "Custom for OEMs, dealer groups, and platforms",
  description:
    "Dedicated infrastructure, SSO, CRM/dealer integrations, and a named success manager.",
  projectLimit: -1,
  monthlyAiCredits: 0, // negotiated
  teamSeats: -1,
  features: {
    watermark: false,
    exportResolution: "8k",
    premiumAssets: true,
    premiumWraps: true,
    unlimitedRevisions: true,
    backgroundRemoval: true,
    aiTools: true,
    aiWrapGeneration: true,
    advancedLayers: true,
    versionHistory: true,
    privateAssetLibrary: true,
    commercialLicense: true,
    priorityRendering: true,
    teamCollab: true,
    whiteLabel: true,
    clientApprovalWorkflow: true,
    brandKit: true,
    leadCapture: true,
    apiAccess: true,
    ssoIntegration: true,
    dedicatedInfra: true,
    prioritySupport: true,
  },
  pricing: {
    IN: { amount: -1, currency: "INR" },
    US: { amount: -1, currency: "USD" },
  },
  isPurchasable: false,
  highlights: [
    "API access & SSO",
    "Dealer + CRM integrations",
    "Dedicated infrastructure",
    "Named success manager",
    "Custom AI credit pool",
  ],
}

export const PLAN_TIERS: Plan[] = [
  FREE_PLAN,
  CREATOR_PLAN,
  PRO_PLAN,
  STUDIO_PLAN,
  ENTERPRISE_PLAN,
]

export const PLAN_BY_TIER: Record<PlanTier, Plan> = {
  free: FREE_PLAN,
  creator: CREATOR_PLAN,
  pro: PRO_PLAN,
  studio: STUDIO_PLAN,
  enterprise: ENTERPRISE_PLAN,
}

export function getPlanByTier(tier: string): Plan | undefined {
  return PLAN_BY_TIER[tier as PlanTier]
}

const TIER_ORDER: PlanTier[] = ["free", "creator", "pro", "studio", "enterprise"]

export function planRank(tier: PlanTier): number {
  return TIER_ORDER.indexOf(tier)
}

export function isHigherTier(a: PlanTier, b: PlanTier): boolean {
  return planRank(a) > planRank(b)
}

/** Resolve an annual price using the override if present, else monthly * (12 - ANNUAL_DISCOUNT_MONTHS). */
export function getAnnualAmount(
  plan: Plan,
  country: "IN" | "US",
): number {
  if (plan.annualPricingOverride) {
    return plan.annualPricingOverride[country].amount
  }
  const monthly = plan.pricing[country].amount
  if (monthly < 0) return monthly
  return monthly * (12 - ANNUAL_DISCOUNT_MONTHS)
}

export function getPlanPrice(
  plan: Plan,
  country: "IN" | "US",
  cycle: BillingCycle,
): { amount: number; currency: "INR" | "USD" } {
  const currency = country === "IN" ? "INR" : "USD"
  const amount = cycle === "annual" ? getAnnualAmount(plan, country) : plan.pricing[country].amount
  return { amount, currency }
}

/** Months added per billing cycle. */
export function billingCycleMonths(cycle: BillingCycle): number {
  return cycle === "annual" ? 12 : 1
}

export function formatPlanPrice(amount: number, currency: "INR" | "USD"): string {
  if (amount < 0) return "Contact Sales"
  if (amount === 0) return currency === "INR" ? "₹0" : "$0"
  if (currency === "INR") return `₹${amount.toLocaleString("en-IN")}`
  return `$${amount.toLocaleString("en-US")}`
}
