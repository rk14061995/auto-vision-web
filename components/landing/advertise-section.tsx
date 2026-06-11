import Link from "next/link"
import { AD_TYPES, formatPrice } from "@/lib/products"
import { ArrowRight, Target, Zap, BadgeCheck, BarChart3, Megaphone, Users, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Region } from "@/lib/region"

const COPY: Record<"us" | "in" | "default", {
  badge: string
  headline: string
  headlineHighlight: string
  sub: string
  ctaLabel: string
  currency: "USD" | "INR"
  audienceLabel: string
  audienceSub: string
}> = {
  us: {
    badge: "Advertise on AutoVision Pro",
    headline: "Reach America's Most Engaged",
    headlineHighlight: "Car Enthusiasts",
    sub: "Put your wrap shop, dealership, or auto brand in front of thousands of active car-customization enthusiasts — people who are already spending money on their vehicles. Simple setup, no subscriptions, go live today.",
    ctaLabel: "Start Advertising",
    currency: "USD",
    audienceLabel: "Automotive-only audience",
    audienceSub: "Every visitor is here for car customization — zero wasted impressions.",
  },
  in: {
    badge: "AutoVision Pro par Advertise Karein",
    headline: "India ke Sabse Active",
    headlineHighlight: "Car Enthusiasts tak Pahunchein",
    sub: "Apne wrap shop, dealership, ya auto accessories brand ko hajaaron active car customization enthusiasts ke saamne laayein — woh log jo apni gaadi par already paisa kharch kar rahe hain. Simple setup, koi subscription nahi, aaj hi live ho jaayein.",
    ctaLabel: "Abhi Advertise Karein",
    currency: "INR",
    audienceLabel: "100% Automotive Audience",
    audienceSub: "Har visitor yahan car customization ke liye aata hai — koi bhi impression waste nahi.",
  },
  default: {
    badge: "Advertise on AutoVision Pro",
    headline: "Reach the Most Engaged",
    headlineHighlight: "Car Enthusiasts",
    sub: "Put your wrap shop, dealership, or auto brand in front of thousands of active car-customization enthusiasts — people who are already spending money on their vehicles. Simple setup, no subscriptions.",
    ctaLabel: "Start Advertising",
    currency: "INR",
    audienceLabel: "Automotive-only audience",
    audienceSub: "Every visitor is here for car customization — zero wasted impressions.",
  },
}

const BENEFITS = [
  {
    icon: Target,
    title: "Laser-Targeted Audience",
    desc: "Reach people who are actively planning wraps, colour changes, and upgrades — highest purchase intent in automotive.",
  },
  {
    icon: Users,
    title: "Growing Community",
    desc: "AutoVision Pro's user base is 100% car enthusiasts, shop owners, and automotive professionals — your ideal buyers.",
  },
  {
    icon: Zap,
    title: "Live in Minutes",
    desc: "Upload your creative, pay once, and your ad goes live immediately after approval. No agency, no lengthy process.",
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    desc: "Track impressions and clicks from your dashboard so you can see exactly what your spend is delivering.",
  },
  {
    icon: BadgeCheck,
    title: "No Recurring Fees",
    desc: "Pay per placement — a flat one-time fee for the duration. No monthly retainer, no surprise charges.",
  },
  {
    icon: Clock,
    title: "Flexible Duration",
    desc: "Run a 7-day blitz or a 30-day campaign. Renew any time directly from your dashboard.",
  },
]

// Show Banner, Vertical Premium, and Landing Hero as the 3 showcase tiers
const SHOWCASE_IDS = ["banner", "vertical_premium", "landing_hero"]

interface Props {
  region?: Region
}

export function AdvertiseSection({ region }: Props) {
  const copy = region ? COPY[region] : COPY.default
  const showcaseAds = AD_TYPES.filter((a) => SHOWCASE_IDS.includes(a.id))

  return (
    <section
      id="advertise"
      className="py-20 sm:py-32 bg-muted/30 border-y border-border/40"
      aria-label="Advertise your automotive business on AutoVision Pro"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Megaphone className="h-4 w-4" />
            {copy.badge}
          </span>
          <h2 className="mt-6 text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            {copy.headline}{" "}
            <span className="text-primary">{copy.headlineHighlight}</span>
          </h2>
          <p className="mt-5 text-pretty text-lg text-muted-foreground max-w-2xl mx-auto">
            {copy.sub}
          </p>
        </div>

        {/* Benefit grid */}
        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              className="group rounded-xl border border-border/50 bg-card/60 p-6 transition-all hover:border-primary/40 hover:bg-card"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <b.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{b.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{b.desc}</p>
            </div>
          ))}
        </div>

        {/* Ad placement cards */}
        <div className="mt-20">
          <h3 className="text-center text-xl font-bold mb-2">Ad Placements &amp; Pricing</h3>
          <p className="text-center text-sm text-muted-foreground mb-10">
            One-time payment · No hidden fees · Cancel anytime before renewal
          </p>

          <div className="grid gap-6 sm:grid-cols-3">
            {showcaseAds.map((ad, i) => {
              const isHighlighted = ad.id === "vertical_premium"
              const price = copy.currency === "USD" ? ad.pricing.US : ad.pricing.IN
              return (
                <div
                  key={ad.id}
                  className={`relative flex flex-col rounded-2xl border p-6 ${
                    isHighlighted
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border/50 bg-card/60"
                  }`}
                >
                  {isHighlighted && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow">
                      Most Popular
                    </span>
                  )}
                  <div>
                    <p className="font-semibold text-base">{ad.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{ad.description}</p>
                  </div>
                  <div className="mt-6 flex items-end gap-1">
                    <span className="text-3xl font-bold">
                      {formatPrice(price.amount, price.currency)}
                    </span>
                    <span className="mb-1 text-sm text-muted-foreground">/ {ad.duration} days</span>
                  </div>
                  <ul className="mt-5 space-y-2 text-sm text-muted-foreground flex-1">
                    <li className="flex items-center gap-2">
                      <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />
                      {ad.dimensions} dimensions
                    </li>
                    <li className="flex items-center gap-2">
                      <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />
                      Up to {ad.maxImages} image{ad.maxImages > 1 ? "s" : ""}
                      {ad.supportsVideo ? " + video" : ""}
                    </li>
                    <li className="flex items-center gap-2">
                      <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />
                      Real-time views &amp; clicks tracking
                    </li>
                    {ad.id === "landing_hero" && (
                      <li className="flex items-center gap-2">
                        <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />
                        Hero placement on public homepage
                      </li>
                    )}
                  </ul>
                  <Link href="/signup?next=/dashboard%3Ftab%3Dcreate-ad" className="mt-6 block">
                    <Button
                      className="w-full gap-2"
                      variant={isHighlighted ? "default" : "outline"}
                      size="sm"
                    >
                      Get Started
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              )
            })}
          </div>
        </div>

        {/* Design service upsell */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background p-8">
            <Megaphone className="h-8 w-8 text-primary mb-4" />
            <h3 className="text-lg font-bold">Have your own creative?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Upload your banner, choose a placement, and go live today. No design skills needed.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/dashboard?tab=create-ad">
                <Button className="gap-2 w-full sm:w-auto">
                  {copy.ctaLabel} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/signup?next=/dashboard%3Ftab%3Dcreate-ad">
                <Button variant="outline" className="w-full sm:w-auto">Sign up free</Button>
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-border/50 bg-card/60 p-8">
            <BadgeCheck className="h-8 w-8 text-primary mb-4" />
            <h3 className="text-lg font-bold">Need a banner designed?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Our team creates a professional ad creative for you — from ₹999 / $20. Submit your brand brief and get your creative in 2–3 business days.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/dashboard?tab=design-service">
                <Button variant="outline" className="gap-2 w-full sm:w-auto">
                  Get banner designed <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/signup?next=/dashboard%3Ftab%3Ddesign-service">
                <Button variant="ghost" className="w-full sm:w-auto text-muted-foreground">New here? Sign up</Button>
              </Link>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
