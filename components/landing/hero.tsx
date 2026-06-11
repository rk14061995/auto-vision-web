"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Check } from "lucide-react"
import { trackCTAClick } from "@/lib/gtag"

const HIGHLIGHTS = [
  "No credit card required",
  "Free trial included",
  "Cancel anytime",
]

const STATS = [
  { value: "50K+",  label: "Active Users" },
  { value: "1M+",   label: "Cars Designed" },
  { value: "99.9%", label: "Uptime" },
  { value: "4.9/5", label: "User Rating" },
]

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white py-20 sm:py-28 lg:py-32">

      {/* Subtle background gradient */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 60% 50%, rgba(0,194,160,0.07) 0%, transparent 70%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-left lg:mx-0">

          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-4 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-sm font-semibold text-primary">AI-Powered Car Customization</span>
          </div>

          {/* Headline */}
          <h1 className="text-balance text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
            Design Your<br />
            Dream Car{" "}
            <span className="text-primary">Virtually</span>
          </h1>

          {/* Sub */}
          <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-gray-600 sm:text-xl">
            Preview wraps, colors, accessories and modifications in stunning
            detail — before you spend a rupee.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link href="/signup" onClick={() => trackCTAClick("Start Free Trial", "hero")}>
              <Button size="lg" className="h-12 gap-2 px-8 text-base shadow-md shadow-primary/20">
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/pricing" onClick={() => trackCTAClick("View Pricing", "hero")}>
              <Button size="lg" variant="outline" className="h-12 px-8 text-base border-gray-300 text-gray-700 hover:bg-gray-50">
                View Pricing
              </Button>
            </Link>
          </div>

          {/* Trust bullets */}
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
            {HIGHLIGHTS.map((h) => (
              <span key={h} className="flex items-center gap-1.5 text-sm text-gray-500">
                <Check className="h-3.5 w-3.5 text-primary" />
                {h}
              </span>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-20 max-w-3xl">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-gray-200 bg-gray-200 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="bg-white px-6 py-8 text-center">
                <p className="text-3xl font-bold text-gray-900 sm:text-4xl">{s.value}</p>
                <p className="mt-1 text-sm font-medium text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
