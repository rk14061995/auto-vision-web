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
  const currency = REGION_CURRENCY[r]
  const title =
    r === "us"
      ? `Pricing in USD — AutoVision Pro`
      : `INR Pricing — AutoVision Pro`
  const description =
    r === "us"
      ? `AutoVision Pro plans priced in USD. From free to enterprise — built for US wrap shops, dealerships, and automotive brands.`
      : `AutoVision Pro ke plans INR mein. Free se enterprise tak — Indian wrap shops, garages aur dealerships ke liye.`

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

  if (r != "us") {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="mx-auto max-w-2xl px-4 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              US market • USD pricing
            </span>
            <h1 className="mt-6 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
              Coming Soon
            </h1>
            <p className="mt-4 text-pretty text-lg text-muted-foreground">
              We&apos;re setting up USD payments for the US market. Drop your email and we&apos;ll notify you the moment it goes live.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a
                href="mailto:autovisionpro07@gmail.com"
                className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Get Notified
              </a>
              <a
                href="/in/pricing"
                className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-secondary px-6 text-sm font-medium text-foreground hover:bg-secondary/80"
              >
                View INR Pricing
              </a>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              Indian market • {REGION_CURRENCY[r]} pricing
            </span>
            <h1 className="mt-5 text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              {content.pricingTitle}
            </h1>
            <p className="mt-4 text-pretty text-lg text-muted-foreground">
              {content.pricingDescription}
            </p>
          </div>

          <div className="mt-14">
            <PricingTable initialCountry={initialCountry} />
          </div>

          <div className="mt-24">
            <PricingFAQ />
          </div>

          <div className="mt-20 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background p-10 text-center">
            <h2 className="text-2xl font-semibold sm:text-3xl">
              Built for the automotive industry
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Indian wrap shops, dealerships, garages aur OEM teams AutoVision Pro use karte hain to pitch designs, clients win karein, aur competition se aage rehein.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <a
                href="/signup"
                className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Free mein Shuru Karein
              </a>
              <a
                href="mailto:autovisionpro07@gmail.com"
                className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-secondary px-6 text-sm font-medium text-foreground hover:bg-secondary/80"
              >
                Talk to Sales
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
