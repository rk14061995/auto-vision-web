import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { isValidRegion, REGION_CONTENT, REGION_CURRENCY, type Region } from "@/lib/region"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { RegionalHero } from "@/components/landing/regional-hero"
import { Features } from "@/components/landing/features"
import { Testimonials } from "@/components/landing/testimonials"
import { RegionalCTA } from "@/components/landing/regional-cta"
import { LandingAdsSection } from "@/components/landing/landing-ads"
import { AdvertiseSection } from "@/components/landing/advertise-section"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://autovision-pro.com"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ region: string }>
}): Promise<Metadata> {
  const { region } = await params
  if (!isValidRegion(region)) return {}

  const r = region as Region
  const content = REGION_CONTENT[r]
  const currency = REGION_CURRENCY[r]
  const pageTitle =
    r === "us"
      ? "Virtual Car Customization for US Businesses"
      : "India's Virtual Car Customization Platform"
  const socialTitle = `AutoVision Pro — ${pageTitle}`
  const description =
    r === "us"
      ? `The leading virtual car customization platform for American automotive businesses. Pitch wraps, color swaps, and mods in ${currency} — before any work begins.`
      : `India ka #1 virtual car customization platform. AI-powered wrap designs aur colour variants — ₹0 se shuru karein.`

  return {
    title: pageTitle,
    description,
    openGraph: {
      title: socialTitle,
      description,
      url: `${APP_URL}/${r}/`,
      images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    },
    twitter: {
      title: socialTitle,
      description,
      images: ["/og-image.png"],
    },
    alternates: {
      canonical: `${APP_URL}/${r}/`,
      languages: {
        "en-US": `${APP_URL}/us/`,
        "en-IN": `${APP_URL}/in/`,
        "x-default": `${APP_URL}/in/`,
      },
    },
  }
}

export default async function RegionalHomePage({
  params,
}: {
  params: Promise<{ region: string }>
}) {
  const { region } = await params
  if (!isValidRegion(region)) notFound()

  const r = region as Region
  const content = REGION_CONTENT[r]
  const currency = REGION_CURRENCY[r]

  const softwareAppJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'AutoVision Pro',
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Web',
    description: content.subheadline,
    url: `${APP_URL}/${r}/`,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: currency,
      description: 'Free plan with 5 AI credits and up to 3 projects',
    },
  }

  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppJsonLd) }}
      />
      <Header />
      <main className="flex-1">
        <RegionalHero region={r} content={content} />
        <Features />
        <LandingAdsSection />
        <Testimonials />
        <AdvertiseSection region={r} />
        <RegionalCTA region={r} content={content} />
        <LandingAdsSection />
      </main>
      <Footer />
    </div>
  )
}
