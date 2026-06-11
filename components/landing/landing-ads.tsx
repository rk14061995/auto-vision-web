import { getActiveAdvertisements } from "@/lib/db"

export async function LandingAdsSection() {
  let ads: Awaited<ReturnType<typeof getActiveAdvertisements>> = []
  try {
    const all = await getActiveAdvertisements()
    ads = all.filter((a) => a.adType === "landing_hero")
  } catch {
    // Non-critical — ads failing should never break the page
    return null
  }

  if (ads.length === 0) return null

  // Pick one at random to display
  const ad = ads[Math.floor(Math.random() * ads.length)]
  const image = ad.images.find((src) => !src.includes(".amazonaws.com")) ?? ad.images[0]

  return (
    <section className="border-y border-border/50 bg-muted/30 py-4">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Sponsored
        </p>
        <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
          {image && (
            <div className="relative h-[220px] w-full overflow-hidden sm:h-[280px] md:h-[340px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt={ad.shopName}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6 text-white">
                <h3 className="text-xl font-bold sm:text-2xl">{ad.shopName}</h3>
                <p className="mt-1 max-w-md text-sm text-white/80">{ad.shopDescription}</p>
                {ad.contactInfo && (
                  <p className="mt-2 text-sm font-medium text-white/90">{ad.contactInfo}</p>
                )}
              </div>
            </div>
          )}
          {!image && (
            <div className="p-6">
              <h3 className="text-xl font-bold">{ad.shopName}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{ad.shopDescription}</p>
              {ad.contactInfo && (
                <p className="mt-2 text-sm text-muted-foreground">{ad.contactInfo}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
