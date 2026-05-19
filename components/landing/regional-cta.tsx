"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { trackCTAClick } from "@/lib/gtag"
import type { Region, RegionContent } from "@/lib/region"

interface Props {
  region: Region
  content: RegionContent
}

const CTA_BY_REGION: Record<Region, { headline: string; sub: string; compareCta: string }> = {
  us: {
    headline: "Ready to win more clients?",
    sub: "Start your free trial today. No credit card required. USD pricing, cancel any time.",
    compareCta: "Compare USD Plans",
  },
  in: {
    headline: "Clients jeetne ke liye ready hain?",
    sub: "Free trial aaj hi shuru karein. Credit card ki zaroorat nahi. INR mein billing, kabhi bhi cancel karein.",
    compareCta: "INR Plans Compare Karein",
  },
}

export function RegionalCTA({ region, content }: Props) {
  const cta = CTA_BY_REGION[region]

  return (
    <section className="py-20 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background p-8 sm:p-16">
          <div className="relative z-10 mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              {cta.headline}
            </h2>
            <p className="mt-4 text-pretty text-lg text-muted-foreground">{cta.sub}</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/signup"
                onClick={() => trackCTAClick("Get Started Free", "cta_section")}
              >
                <Button size="lg" className="gap-2">
                  {content.primaryCta}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link
                href={content.secondaryCtaHref}
                onClick={() => trackCTAClick(cta.compareCta, "cta_section")}
              >
                <Button size="lg" variant="outline">
                  {cta.compareCta}
                </Button>
              </Link>
            </div>
          </div>

          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        </div>
      </div>
    </section>
  )
}
