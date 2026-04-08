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

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    description: "Perfect for trying out the platform",
    projectLimit: 1,
    pricing: {
      IN: { amount: 0, currency: "INR" },
      US: { amount: 0, currency: "USD", lemonSqueezyVariantId: "" },
    },
    features: [
      "1 Project",
      "Basic customization tools",
      "Community support",
      "720p exports",
    ],
    isMonthly: true,
  },
  {
    id: "1-project",
    name: "Starter",
    description: "For individuals getting started",
    projectLimit: 1,
    pricing: {
      IN: { amount: 499, currency: "INR" },
      US: { amount: 9, currency: "USD", lemonSqueezyVariantId: "VARIANT_STARTER" },
    },
    features: [
      "1 Project",
      "All customization tools",
      "Email support",
      "1080p exports",
      "Remove watermark",
    ],
    isMonthly: true,
  },
  {
    id: "5-projects",
    name: "Pro",
    description: "For professionals and small teams",
    projectLimit: 5,
    pricing: {
      IN: { amount: 1999, currency: "INR" },
      US: { amount: 29, currency: "USD", lemonSqueezyVariantId: "VARIANT_PRO" },
    },
    features: [
      "5 Projects",
      "All customization tools",
      "Priority email support",
      "4K exports",
      "Remove watermark",
      "Custom branding",
    ],
    badge: "popular",
    isMonthly: true,
  },
  {
    id: "50-projects",
    name: "Team",
    description: "For growing teams and agencies",
    projectLimit: 50,
    pricing: {
      IN: { amount: 9999, currency: "INR" },
      US: { amount: 149, currency: "USD", lemonSqueezyVariantId: "VARIANT_TEAM" },
    },
    features: [
      "50 Projects",
      "All customization tools",
      "Priority support",
      "4K exports",
      "Remove watermark",
      "Custom branding",
      "Team collaboration",
      "Analytics dashboard",
    ],
    badge: "best-value",
    isMonthly: true,
  },
  {
    id: "100-projects",
    name: "Business",
    description: "For large teams and enterprises",
    projectLimit: 100,
    pricing: {
      IN: { amount: 19999, currency: "INR" },
      US: { amount: 299, currency: "USD", lemonSqueezyVariantId: "VARIANT_BUSINESS" },
    },
    features: [
      "100 Projects",
      "All customization tools",
      "Dedicated support",
      "8K exports",
      "Remove watermark",
      "Custom branding",
      "Team collaboration",
      "Analytics dashboard",
      "API access",
      "SSO integration",
    ],
    isMonthly: true,
  },
  {
    id: "business",
    name: "Enterprise",
    description: "For organizations with custom needs",
    projectLimit: -1, // unlimited
    pricing: {
      IN: { amount: -1, currency: "INR" }, // Contact sales
      US: { amount: -1, currency: "USD", lemonSqueezyVariantId: "" },
    },
    features: [
      "Unlimited Projects",
      "All customization tools",
      "24/7 dedicated support",
      "8K exports",
      "Remove watermark",
      "Custom branding",
      "Team collaboration",
      "Advanced analytics",
      "API access",
      "SSO integration",
      "Custom contracts",
      "On-premise option",
    ],
    isMonthly: true,
  },
]

export function getPlanById(id: string): Plan | undefined {
  return PLANS.find((plan) => plan.id === id)
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
