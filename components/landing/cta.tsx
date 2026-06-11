"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Check } from "lucide-react"
import { trackCTAClick } from "@/lib/gtag"

const POINTS = [
  "Free 14-day trial",
  "No credit card needed",
  "Cancel any time",
]

export function CTA() {
  return (
    <section className="bg-gray-50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 text-center sm:px-16">

          {/* Decorative circles */}
          <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-white/5" />

          <div className="relative z-10 mx-auto max-w-2xl">
            <h2 className="text-balance text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Ready to design your dream car?
            </h2>
            <p className="mt-4 text-pretty text-lg text-white/75">
              Start your free trial today. Visualize wraps, colors, and mods — before you spend a rupee.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/signup" onClick={() => trackCTAClick("Get Started Free", "cta_section")}>
                <Button
                  size="lg"
                  className="h-12 gap-2 bg-white px-8 text-base font-semibold text-primary shadow-lg hover:bg-gray-50"
                >
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/pricing" onClick={() => trackCTAClick("Compare Plans", "cta_section")}>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 border-white/40 px-8 text-base text-white hover:bg-white/10 hover:text-white"
                >
                  Compare Plans
                </Button>
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {POINTS.map((p) => (
                <span key={p} className="flex items-center gap-1.5 text-sm text-white/80">
                  <Check className="h-3.5 w-3.5 text-white" />
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
