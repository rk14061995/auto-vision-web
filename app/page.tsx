import type { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Hero } from "@/components/landing/hero"
import { Features } from "@/components/landing/features"
import { Testimonials } from "@/components/landing/testimonials"
import { CTA } from "@/components/landing/cta"
import { AdvertiseSection } from "@/components/landing/advertise-section"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://autovision-pro.com"

// This page renders the same region="us" content as /us verbatim — it exists
// only so bots hitting the bare domain see something instead of a redirect
// (see middleware.ts's isBot exemption). Without a canonical tag, Google was
// treating "/" and "/us" as duplicates and picking "/" as canonical instead
// of the one /us itself declares — which meant /us wasn't getting indexed
// under its own URL. Declaring the canonical here, in agreement with what
// /us already declares about itself, resolves that conflict.
export const metadata: Metadata = {
  alternates: {
    canonical: `${APP_URL}/us`,
  },
}

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <Features region="us" />
        <Testimonials region="us" />
        <AdvertiseSection />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}
