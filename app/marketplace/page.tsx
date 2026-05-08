import type { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { listPublicAssets } from "@/lib/marketplace"

export const metadata: Metadata = {
  title: "Marketplace — AutoVision Pro",
  description: "Premium wraps, decals, and templates created by the community.",
}

export const dynamic = "force-dynamic"

export default async function MarketplacePage() {
  const assets = await listPublicAssets({ limit: 48 })
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-3xl font-bold sm:text-4xl">Marketplace</h1>
            <p className="mt-3 text-lg text-muted-foreground">
              Premium wraps, decals, body kits, and templates created by the
              AutoVision community.
            </p>
          </div>

          {assets.length === 0 ? (
            <div className="mx-auto mt-16 max-w-md rounded-2xl border border-dashed border-border p-10 text-center">
              <p className="text-lg font-medium">Marketplace is launching soon</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Curated assets from top creators are on the way. Check back next week.
              </p>
            </div>
          ) : (
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {assets.map((asset) => (
                <article
                  key={String(asset._id)}
                  className="group overflow-hidden rounded-xl border border-border/50 bg-card transition-shadow hover:shadow-lg"
                >
                  <div className="relative aspect-[4/3] bg-secondary">
                    {asset.thumbnailUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={asset.thumbnailUrl}
                        alt={asset.title}
                        className="h-full w-full object-cover"
                      />
                    )}
                    {asset.premium && (
                      <span className="absolute left-3 top-3 rounded-full bg-amber-500/90 px-2 py-0.5 text-xs font-medium text-amber-950">
                        Premium
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {asset.type.replace("_", " ")}
                    </p>
                    <h3 className="mt-1 font-semibold">{asset.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {asset.description}
                    </p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {asset.downloads} downloads
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
