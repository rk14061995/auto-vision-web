"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { trackCTAClick } from "@/lib/gtag"

export function CTA() {
  return (
    <section className="py-20 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background p-8 sm:p-16">
          <div className="relative z-10 mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to design your dream car?
            </h2>
            <p className="mt-4 text-pretty text-lg text-muted-foreground">
              Start your free trial today. No credit card required.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/signup" onClick={() => trackCTAClick("Get Started Free", "cta_section")}>
                <Button size="lg" className="gap-2">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/pricing" onClick={() => trackCTAClick("Compare Plans", "cta_section")}>
                <Button size="lg" variant="outline">
                  Compare Plans
                </Button>
              </Link>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        </div>
      </div>
    </section>
  )
}
