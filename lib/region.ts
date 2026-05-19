import type { Country } from './geo'

export type Region = 'us' | 'in'

export const REGIONS: Region[] = ['us', 'in']

export function isValidRegion(r: string): r is Region {
  return REGIONS.includes(r as Region)
}

export const REGION_TO_COUNTRY: Record<Region, Country> = {
  us: 'US',
  in: 'IN',
}

export const REGION_CURRENCY: Record<Region, string> = {
  us: 'USD',
  in: 'INR',
}

export const REGION_LOCALE: Record<Region, string> = {
  us: 'en-US',
  in: 'en-IN',
}

export interface RegionContent {
  badge: string
  headline: string
  headlineHighlight: string
  subheadline: string
  primaryCta: string
  secondaryCta: string
  secondaryCtaHref: string
  pricingTitle: string
  pricingDescription: string
}

export const REGION_CONTENT: Record<Region, RegionContent> = {
  us: {
    badge: 'For US wrap shops, dealerships & brands',
    headline: 'Design. Preview.',
    headlineHighlight: 'Win Every US Client.',
    subheadline:
      'The leading virtual car customization platform for American automotive businesses. Pitch wraps, color swaps, and mods in photorealistic detail — before any work begins.',
    primaryCta: 'Start Free Trial',
    secondaryCta: 'View USD Pricing',
    secondaryCtaHref: '/us/pricing',
    pricingTitle: 'Simple pricing in USD',
    pricingDescription:
      'Plans for every US shop — from solo freelancers to multi-bay wrap studios. Pay in dollars, cancel any time.',
  },
  in: {
    badge: 'For Indian wrap shops, garages & dealerships',
    headline: 'Design Karo. Preview Karo.',
    headlineHighlight: 'Har Client Jeeto.',
    subheadline:
      "India's virtual car customization platform. AI-powered wrap designs, colour variants, and modification previews built for the Indian automotive market. Plans starting at ₹0.",
    primaryCta: 'Free mein Shuru Karein',
    secondaryCta: 'INR Pricing Dekhein',
    secondaryCtaHref: '/in/pricing',
    pricingTitle: 'INR mein simple pricing',
    pricingDescription:
      'Har budget ke liye plan — solo designer se lekar wrap studio tak. Rupees mein pay karein, kabhi bhi cancel karein.',
  },
}
