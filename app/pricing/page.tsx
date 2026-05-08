import type { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { PricingTable } from "@/components/pricing/pricing-table"
import { PricingFAQ } from "@/components/pricing/pricing-faq"

export const metadata: Metadata = {
  title: "Pricing - AutoVision Pro",
  description:
    "Choose the perfect plan for your car customization needs. From free trials to enterprise solutions.",
}

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              For creators, shops, and brands
            </span>
            <h1 className="mt-5 text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              The visual platform for automotive customization
            </h1>
            <p className="mt-4 text-pretty text-lg text-muted-foreground">
              Start free, scale to studio. Each tier includes monthly AI credits
              for wraps, color variants, background removal, and more — failed
              generations are auto-refunded.
            </p>
          </div>

          <div className="mt-14">
            <PricingTable />
          </div>

          <div className="mt-24">
            <PricingFAQ />
          </div>

          <div className="mt-20 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background p-10 text-center">
            <h2 className="text-2xl font-semibold sm:text-3xl">
              Built for the automotive industry
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Wrap shops, dealerships, garages, and OEM teams use AutoVision Pro
              to pitch designs, win clients, and ship faster than the competition.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <a
                href="/signup"
                className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Start Free
              </a>
              <a
                href="mailto:sales@autovision.pro"
                className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-secondary px-6 text-sm font-medium text-foreground hover:bg-secondary/80"
              >
                Talk to Sales
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
