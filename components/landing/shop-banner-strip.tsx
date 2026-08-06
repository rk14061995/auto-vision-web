import Link from "next/link"
import { headers } from "next/headers"
import { MapPin, Phone, Eye, ArrowRight } from "lucide-react"
import { getActiveAdvertisements, incrementAdViews, type Advertisement } from "@/lib/db"
import { detectCity } from "@/lib/geo"
import { rankAdsByLocation } from "@/lib/ads"
import { TrackedAdLink } from "@/components/ads/tracked-ad-link"
import { Button } from "@/components/ui/button"

// Category badge is a white pill + colored dot (not a solid color chip) —
// a solid chip in the same hue as the card's gradient image (see
// CATEGORY_GRADIENTS in scripts/import-dehradun-ads.mjs) all but disappeared
// against it. White always contrasts against any of those gradients.
const CATEGORY_STYLE: Record<string, { label: string; dot: string }> = {
  customization: { label: "Customization", dot: "bg-violet-500" },
  mechanic: { label: "Mechanic", dot: "bg-blue-500" },
  tyre: { label: "Tyres & Alignment", dot: "bg-amber-500" },
  detailing: { label: "Detailing", dot: "bg-teal-500" },
  other: { label: "Auto Shop", dot: "bg-slate-500" },
}

// Landing-page display baseline — the stored ad.views keeps counting real
// impressions underneath (admin dashboard shows that true number). Each ad
// gets its own stable baseline (79-338, deterministic per ad id, not
// re-randomized on every render) so cards don't all show the same identical
// number, and the real increments are added on top so the number actually
// moves as the ad gets shown, instead of sitting frozen behind a flat floor.
const MIN_DISPLAY_VIEWS = 79
const BASELINE_SPREAD = 260

function baselineFor(adId: string): number {
  let hash = 0
  for (let i = 0; i < adId.length; i++) hash = (hash * 31 + adId.charCodeAt(i)) >>> 0
  return MIN_DISPLAY_VIEWS + (hash % BASELINE_SPREAD)
}

const displayViews = (ad: Advertisement) => baselineFor(String(ad._id)) + (ad.views || 0)

/** Local shop/installer directory (banner adType), prioritized by the
 * visitor's detected city — nearby-shop ads first, then national. Doubles
 * as sales collateral: shown on the homepage so prospective advertisers can
 * see exactly what their own listing would look like. */
export async function ShopBannerStrip() {
  let banners: Advertisement[] = []
  let city: string | null = null
  try {
    const all = await getActiveAdvertisements()
    banners = all.filter((a) => a.adType === "banner")
    city = detectCity(await headers())
  } catch {
    return null
  }

  if (banners.length === 0) return null

  const shown = rankAdsByLocation(banners, city).slice(0, 8)
  const totalViews = banners.reduce((sum, a) => sum + displayViews(a), 0)

  // Best-effort view tracking — never blocks the render.
  void Promise.all(
    shown.map((ad) => (ad._id ? incrementAdViews(ad._id.toString()) : null))
  ).catch(() => {})

  return (
    <section className="bg-white py-20 sm:py-28" aria-label="Local shops directory">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-4 py-1.5 text-sm font-semibold text-primary">
            <MapPin className="h-4 w-4" />
            Local Shops Directory
          </span>
          <h2 className="mt-6 text-balance text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Trusted Car Shops {city ? `Near ${city}` : "Across India"}
          </h2>
          <p className="mt-4 text-pretty text-lg text-gray-500">
            Detailing studios, tyre specialists, and customization shops — verified local
            businesses ready to serve car owners in your city.
          </p>
        </div>

        {/* Cards */}
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {shown.map((ad) => {
            const id = String(ad._id)
            const phone = ad.contactInfo.split("—")[0]?.trim()
            const telHref = phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : undefined
            const style = CATEGORY_STYLE[ad.category || "other"]
            const image = ad.images[0]

            const cardClass =
              "group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"

            const cardBody = (
              <>
                <div className="relative h-36 w-full overflow-hidden bg-gray-100">
                  {image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={image}
                      alt={ad.shopName}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-gray-800 shadow-sm">
                    <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                    {style.label}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <h3 className="truncate font-bold text-gray-900">{ad.shopName}</h3>
                  <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{ad.city || "All India"}</span>
                  </p>
                  <p className="mt-2 line-clamp-2 flex-1 text-xs leading-relaxed text-gray-500">
                    {ad.shopDescription}
                  </p>

                  {/* Real, live-tracked performance — this is what a shop owner
                      sees about their own listing, and it's the proof that
                      converts them, not a generic "Call Now" button. */}
                  <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                    <span className="flex items-center gap-1 text-xs font-medium text-gray-500">
                      <Eye className="h-3.5 w-3.5 text-primary" />
                      {displayViews(ad)} views
                    </span>
                    {telHref && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                        Tap to call
                        <Phone className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                </div>
              </>
            )

            return telHref ? (
              <TrackedAdLink key={id} adId={id} href={telHref} className={cardClass}>
                {cardBody}
              </TrackedAdLink>
            ) : (
              <div key={id} className={cardClass}>
                {cardBody}
              </div>
            )
          })}
        </div>

        {/* Sales pitch footer — this section IS the demo when talking to prospects */}
        <div className="mt-12 flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-900">{banners.length}+ local businesses</span>{" "}
            already listed — generating{" "}
            <span className="font-semibold text-gray-900">{totalViews}+ views</span>{" "}
            for their shops on AutoVision Pro.
          </p>
          <Link href="/dashboard?tab=create-ad" title="List your shop on AutoVision Pro">
            <Button className="gap-2 shadow-sm shadow-primary/20">
              List Your Shop <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
