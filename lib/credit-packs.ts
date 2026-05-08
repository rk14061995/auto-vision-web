// Credit costs per AI feature and one-time credit pack catalog.

import type { AICreditFeature } from "./db"

export type AICreditableFeature = Exclude<
  AICreditFeature,
  "admin_grant" | "credit_pack" | "monthly_reset" | "signup_bonus"
>

export const CREDIT_COSTS: Record<AICreditableFeature, number> = {
  ai_wrap_generate: 5,
  ai_background_remove: 2,
  ai_color_variants: 3,
  ai_wheel_suggest: 2,
  ai_enhance: 4,
}

export interface CreditPack {
  id: string
  credits: number
  pricing: {
    IN: { amount: number; currency: "INR" }
    US: { amount: number; currency: "USD"; lemonSqueezyVariantId?: string }
  }
  highlight?: string
}

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: "pack_100",
    credits: 100,
    pricing: {
      IN: { amount: 199, currency: "INR" },
      US: { amount: 5, currency: "USD" },
    },
  },
  {
    id: "pack_500",
    credits: 500,
    pricing: {
      IN: { amount: 699, currency: "INR" },
      US: { amount: 15, currency: "USD" },
    },
    highlight: "Best Value",
  },
  {
    id: "pack_2000",
    credits: 2000,
    pricing: {
      IN: { amount: 1999, currency: "INR" },
      US: { amount: 39, currency: "USD" },
    },
  },
]

export function getCreditPackById(id: string): CreditPack | undefined {
  return CREDIT_PACKS.find((p) => p.id === id)
}

export function getCreditPackPrice(
  pack: CreditPack,
  country: "IN" | "US",
): { amount: number; currency: "INR" | "USD" } {
  return country === "IN"
    ? { amount: pack.pricing.IN.amount, currency: "INR" }
    : { amount: pack.pricing.US.amount, currency: "USD" }
}
