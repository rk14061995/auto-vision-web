import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { isValidRegion, REGION_CONTENT, REGION_CURRENCY, REGION_TO_COUNTRY, type Region } from "@/lib/region"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { PricingTable } from "@/components/pricing/pricing-table"
import { PricingFAQ } from "@/components/pricing/pricing-faq"
import { PricingTracker } from "@/components/pricing/pricing-tracker"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://auto-vision-pro.com"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ region: string }>
}): Promise<Metadata> {
  const { region } = await params
  if (!isValidRegion(region)) return {}

  const r = region as Region
  const title =
    r === "us"
      ? "Pricing in USD — AutoVision Pro"
      : "INR Pricing — AutoVision Pro"
  const description =
    r === "us"
      ? "AutoVision Pro plans in USD. From free to enterprise — built for US wrap shops, dealerships, and automotive brands."
      : "AutoVision Pro ke plans INR mein. Free se enterprise tak — Indian wrap shops, garages aur dealerships ke liye."

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${APP_URL}/${r}/pricing`,
      images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    },
    alternates: {
      canonical: `${APP_URL}/${r}/pricing`,
      languages: {
        "en-US": `${APP_URL}/us/pricing`,
        "en-IN": `${APP_URL}/in/pricing`,
        "x-default": `${APP_URL}/in/pricing`,
      },
    },
  }
}

const CONTENT = {
  in: {
    badge:       "India · INR pricing",
    ctaStart:    "Free mein Shuru Karein",
    ctaContact:  "Talk to Sales",
    industryDesc: "Indian wrap shops, dealerships, garages aur OEM teams AutoVision Pro use karte hain to pitch designs, clients win karein, aur competition se aage rehein.",
  },
  us: {
    badge:       "United States · USD pricing",
    ctaStart:    "Start Free",
    ctaContact:  "Talk to Sales",
    industryDesc: "Wrap shops, dealerships, garages, and OEM teams use AutoVision Pro to pitch designs, win clients, and stay ahead of the competition.",
  },
}

export default async function RegionalPricingPage({
  params,
}: {
  params: Promise<{ region: string }>
}) {
  const { region } = await params
  if (!isValidRegion(region)) notFound()

  const r = region as Region
  const content = REGION_CONTENT[r]
  const initialCountry = REGION_TO_COUNTRY[r]
  const copy = CONTENT[r]

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <main className="flex-1 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/8 px-4 py-1.5 text-sm font-semibold text-primary">
              {copy.badge}
            </span>
            <h1 className="mt-5 text-balance text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
              {content.pricingTitle}
            </h1>
            <p className="mt-4 text-pretty text-lg text-gray-500">
              {content.pricingDescription}
            </p>
          </div>

          {/* Pricing table — country locked to region, no switcher */}
          <div className="mt-14">
            <PricingTable initialCountry={initialCountry} />
          </div>

          {/* FAQ */}
          <div className="mt-24">
            <PricingFAQ />
          </div>

          {/* Industry CTA */}
          <div className="mt-20 overflow-hidden rounded-3xl bg-primary px-10 py-14 text-center">
            <div className="pointer-events-none absolute inset-0 opacity-10" />
            <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
              Built for the automotive industry
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-white/75">
              {copy.industryDesc}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a
                href="/signup"
                className="inline-flex h-11 items-center justify-center rounded-md bg-white px-6 text-sm font-semibold text-primary shadow hover:bg-gray-50"
              >
                {copy.ctaStart}
              </a>
              <a
                href="mailto:autovisionpro07@gmail.com"
                className="inline-flex h-11 items-center justify-center rounded-md border border-white/30 px-6 text-sm font-medium text-white hover:bg-white/10"
              >
                {copy.ctaContact}
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <PricingTracker />
    </div>
  )
}
