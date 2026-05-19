import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { isValidRegion, REGIONS, REGION_LOCALE, type Region } from "@/lib/region"

interface Props {
  children: React.ReactNode
  params: Promise<{ region: string }>
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://auto-vision-pro.com"

export async function generateMetadata({ params }: { params: Promise<{ region: string }> }): Promise<Metadata> {
  const { region } = await params
  if (!isValidRegion(region)) return {}

  return {
    alternates: {
      canonical: `${APP_URL}/${region}/`,
      languages: {
        "en-US": `${APP_URL}/us/`,
        "en-IN": `${APP_URL}/in/`,
        "x-default": `${APP_URL}/in/`,
      },
    },
    openGraph: {
      locale: REGION_LOCALE[region as Region],
      alternateLocale: REGIONS.filter((r) => r !== region).map((r) => REGION_LOCALE[r]),
    },
  }
}

export function generateStaticParams() {
  return REGIONS.map((region) => ({ region }))
}

export default async function RegionLayout({ children, params }: Props) {
  const { region } = await params

  if (!isValidRegion(region)) notFound()

  return <>{children}</>
}
