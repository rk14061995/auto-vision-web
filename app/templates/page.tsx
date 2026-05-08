import type { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { listActiveTemplates } from "@/lib/templates"

export const metadata: Metadata = {
  title: "Weekly Template Drops — AutoVision Pro",
  description: "Fresh design templates dropped every week.",
}

export const dynamic = "force-dynamic"

export default async function TemplatesPage() {
  const templates = await listActiveTemplates(24)
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-3xl font-bold sm:text-4xl">Weekly template drops</h1>
            <p className="mt-3 text-lg text-muted-foreground">
              Fresh, premium-quality templates added every Monday. Use them to
              jump-start your next build.
            </p>
          </div>
          {templates.length === 0 ? (
            <div className="mx-auto mt-16 max-w-md rounded-2xl border border-dashed border-border p-10 text-center">
              <p className="text-lg font-medium">First drop coming soon</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Subscribe to AutoVision Pro to get notified the moment new templates land.
              </p>
            </div>
          ) : (
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((tpl) => (
                <article
                  key={String(tpl._id)}
                  className="overflow-hidden rounded-xl border border-border/50 bg-card transition-shadow hover:shadow-lg"
                >
                  <div className="relative aspect-[4/3] bg-secondary">
                    {tpl.thumbnailUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={tpl.thumbnailUrl}
                        alt={tpl.title}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold">{tpl.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {tpl.description}
                    </p>
                    {tpl.tags?.length ? (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {tpl.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-secondary/60 px-2 py-0.5 text-xs text-muted-foreground"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
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
