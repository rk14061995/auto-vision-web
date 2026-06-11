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
}> = {
  us: {
    badge: "Advertise on AutoVision Pro",
    headline: "Reach America's Most Engaged",
    headlineHighlight: "Car Enthusiasts",
    sub: "Put your wrap shop, dealership, or auto brand in front of thousands of active car-customization enthusiasts — people already spending on their vehicles. Simple setup, no subscriptions, go live today.",
    ctaLabel: "Start Advertising",
    currency: "USD",
  },
  in: {
    badge: "AutoVision Pro par Advertise Karein",
    headline: "India ke Sabse Active",
    headlineHighlight: "Car Enthusiasts tak Pahunchein",
    sub: "Apne wrap shop, dealership, ya auto brand ko hajaaron active car enthusiasts ke saamne laayein — woh log jo already paisa kharch kar rahe hain. Simple setup, koi subscription nahi, aaj hi live jaayein.",
    ctaLabel: "Abhi Advertise Karein",
    currency: "INR",
  },
  default: {
    badge: "Advertise on AutoVision Pro",
    headline: "Reach the Most Engaged",
    headlineHighlight: "Car Enthusiasts",
    sub: "Put your wrap shop, dealership, or auto brand in front of thousands of active car-customization enthusiasts. Simple setup, no subscriptions, go live today.",
    ctaLabel: "Start Advertising",
    currency: "INR",
  },
}

const BENEFITS = [
  { icon: Target,    title: "Laser-Targeted",     desc: "Reach people actively planning wraps, colour changes, and upgrades — the highest purchase intent in automotive." },
  { icon: Users,     title: "Growing Community",  desc: "100% car enthusiasts, shop owners, and automotive professionals — your exact ideal buyers." },
  { icon: Zap,       title: "Live in Minutes",    desc: "Upload your creative, pay once, and your ad goes live immediately after approval. No agency needed." },
  { icon: BarChart3, title: "Real-time Analytics", desc: "Track impressions and clicks from your dashboard so you know exactly what your spend is delivering." },
  { icon: BadgeCheck,title: "No Recurring Fees",  desc: "Pay per placement — flat one-time fee for the duration. No monthly retainer, no surprise charges." },
  { icon: Clock,     title: "Flexible Duration",  desc: "Run a 7-day blitz or a 30-day campaign. Renew any time from your dashboard." },
]

const SHOWCASE_IDS = ["banner", "vertical_premium", "landing_hero"]

interface Props { region?: Region }

export function AdvertiseSection({ region }: Props) {
  const copy = region ? COPY[region] : COPY.default
  const showcaseAds = AD_TYPES.filter((a) => SHOWCASE_IDS.includes(a.id))

  return (
    <section id="advertise" className="bg-white py-20 sm:py-28" aria-label="Advertise on AutoVision Pro">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-4 py-1.5 text-sm font-semibold text-primary">
            <Megaphone className="h-4 w-4" />
            {copy.badge}
          </span>
          <h2 className="mt-6 text-balance text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
            {copy.headline}{" "}
            <span className="text-primary">{copy.headlineHighlight}</span>
          </h2>
          <p className="mt-5 text-pretty text-lg text-gray-500 max-w-2xl mx-auto">
            {copy.sub}
          </p>
        </div>

        {/* Benefits grid */}
        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              className="rounded-2xl border border-gray-200 bg-gray-50 p-6 transition-all hover:border-primary/30 hover:bg-white hover:shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <b.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">{b.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">{b.desc}</p>
            </div>
          ))}
        </div>

        {/* Pricing cards */}
        <div className="mt-20">
          <h3 className="text-center text-2xl font-extrabold text-gray-900">Ad Placements &amp; Pricing</h3>
          <p className="mt-2 text-center text-sm text-gray-500">
            One-time payment · No hidden fees · Renew any time
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {showcaseAds.map((ad) => {
              const isHighlighted = ad.id === "vertical_premium"
              const price = copy.currency === "USD" ? ad.pricing.US : ad.pricing.IN
              return (
                <div
                  key={ad.id}
                  className={`relative flex flex-col rounded-2xl border p-7 transition-all ${
                    isHighlighted
                      ? "border-primary bg-primary shadow-xl shadow-primary/15"
                      : "border-gray-200 bg-white shadow-sm hover:shadow-md"
                  }`}
                >
                  {isHighlighted && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-white px-4 py-1 text-xs font-bold text-primary shadow">
                      Most Popular
                    </span>
                  )}
                  <p className={`font-bold text-lg ${isHighlighted ? "text-white" : "text-gray-900"}`}>{ad.name}</p>
                  <p className={`mt-1 text-sm ${isHighlighted ? "text-white/75" : "text-gray-500"}`}>{ad.description}</p>
                  <div className="mt-6 flex items-end gap-1">
                    <span className={`text-3xl font-extrabold ${isHighlighted ? "text-white" : "text-gray-900"}`}>
                      {formatPrice(price.amount, price.currency)}
                    </span>
                    <span className={`mb-1 text-sm ${isHighlighted ? "text-white/70" : "text-gray-400"}`}>/ {ad.duration} days</span>
                  </div>
                  <ul className="mt-5 space-y-2.5 flex-1">
                    {[
                      `${ad.dimensions} dimensions`,
                      `Up to ${ad.maxImages} image${ad.maxImages > 1 ? "s" : ""}${ad.supportsVideo ? " + video" : ""}`,
                      "Real-time views & clicks tracking",
                      ...(ad.id === "landing_hero" ? ["Hero placement on homepage"] : []),
                    ].map((feat) => (
                      <li key={feat} className={`flex items-center gap-2 text-sm ${isHighlighted ? "text-white/80" : "text-gray-500"}`}>
                        <BadgeCheck className={`h-4 w-4 shrink-0 ${isHighlighted ? "text-white" : "text-primary"}`} />
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <Link href="/signup?next=/dashboard%3Ftab%3Dcreate-ad" className="mt-7 block">
                    <Button
                      className={`w-full gap-2 ${isHighlighted ? "bg-white text-primary hover:bg-gray-50" : ""}`}
                      variant={isHighlighted ? "outline" : "default"}
                      size="sm"
                    >
                      Get Started <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              )
            })}
          </div>
        </div>

        {/* Upsell cards */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8">
            <Megaphone className="h-8 w-8 text-primary mb-4" />
            <h3 className="text-lg font-bold text-gray-900">Have your own creative?</h3>
            <p className="mt-2 text-sm text-gray-500">
              Upload your banner, choose a placement, and go live today. No design skills needed.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/dashboard?tab=create-ad">
                <Button className="gap-2 w-full sm:w-auto shadow-sm">
                  {copy.ctaLabel} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/signup?next=/dashboard%3Ftab%3Dcreate-ad">
                <Button variant="outline" className="w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-white">Sign up free</Button>
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8">
            <BadgeCheck className="h-8 w-8 text-primary mb-4" />
            <h3 className="text-lg font-bold text-gray-900">Need a banner designed?</h3>
            <p className="mt-2 text-sm text-gray-500">
              Our team creates a professional ad creative for you — {copy.currency === "USD" ? "from $20" : "from ₹199"}. Submit your brief and get your creative in 2–3 business days.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/dashboard?tab=design-service">
                <Button variant="outline" className="gap-2 w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-white">
                  Get banner designed <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/signup?next=/dashboard%3Ftab%3Ddesign-service">
                <Button variant="ghost" className="w-full sm:w-auto text-gray-500 hover:text-gray-700">New here? Sign up</Button>
              </Link>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
