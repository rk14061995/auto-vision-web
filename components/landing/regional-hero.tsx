"use client"

import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { trackCTAClick } from "@/lib/gtag"
import type { Region, RegionContent } from "@/lib/region"

interface Props {
  region: Region
  content: RegionContent
}

const STATS_BY_REGION: Record<Region, { value: string; label: string }[]> = {
  us: [
    { value: "50K+", label: "Active Users" },
    { value: "1M+", label: "Cars Designed" },
    { value: "99.9%", label: "Uptime" },
    { value: "4.9/5", label: "User Rating" },
  ],
  in: [
    { value: "50K+", label: "Active Users" },
    { value: "10L+", label: "Cars Designed" },
    { value: "99.9%", label: "Uptime" },
    { value: "4.9/5", label: "User Rating" },
  ],
}

export function RegionalHero({ region, content }: Props) {
  const stats = STATS_BY_REGION[region]

  return (
    <section className="relative overflow-hidden py-20 sm:py-32">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">{content.badge}</span>
          </div>

          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {content.headline}{" "}
            <span className="text-primary">{content.headlineHighlight}</span>
          </h1>

          <p className="mt-6 text-pretty text-lg text-muted-foreground sm:text-xl">
            {content.subheadline}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              onClick={() => trackCTAClick(content.primaryCta, "hero")}
            >
              <Button size="lg" className="gap-2">
                {content.primaryCta}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link
              href={content.secondaryCtaHref}
              onClick={() => trackCTAClick(content.secondaryCta, "hero")}
            >
              <Button size="lg" variant="outline">
                {content.secondaryCta}
              </Button>
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-2 gap-8 border-t border-border/40 pt-10 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-foreground sm:text-3xl">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
