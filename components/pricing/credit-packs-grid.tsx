"use client"

import { Sparkles, Zap } from "lucide-react"
import { CREDIT_PACKS } from "@/lib/credit-packs"
import { formatPlanPrice } from "@/lib/plans"

interface CreditPacksGridProps {
  country: "IN" | "US"
}

export function CreditPacksGrid({ country }: CreditPacksGridProps) {
  return (
    <div className="rounded-3xl border border-border/40 bg-gradient-to-br from-primary/5 via-card/40 to-card p-6 sm:p-10">
      <div className="flex items-center gap-2 text-sm text-primary">
        <Zap className="h-4 w-4" />
        <span className="font-medium">Need more AI?</span>
      </div>
      <h3 className="mt-2 text-2xl font-semibold sm:text-3xl">
        Top up with credit packs
      </h3>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        One-time top-ups roll over and never expire. Use them on top of your
        monthly plan credits — no rebill, no auto-renew.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {CREDIT_PACKS.map((pack) => {
          const price = country === "IN" ? pack.pricing.IN : pack.pricing.US
          const perCredit = price.amount / pack.credits
          return (
            <div
              key={pack.id}
              className={`flex flex-col rounded-2xl border p-5 ${
                pack.highlight
                  ? "border-primary bg-card shadow-md shadow-primary/10"
                  : "border-border/50 bg-card/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold">{pack.credits.toLocaleString()}</p>
                {pack.highlight && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                    <Sparkles className="h-3 w-3" />
                    {pack.highlight}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">credits</p>

              <p className="mt-4 text-2xl font-semibold">
                {formatPlanPrice(price.amount, price.currency)}
              </p>
              <p className="text-xs text-muted-foreground">
                {price.currency === "INR" ? "₹" : "$"}
                {perCredit.toFixed(2)} / credit
              </p>

              <button
                type="button"
                className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                onClick={async () => {
                  const res = await fetch("/api/credits/purchase", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      creditPackId: pack.id,
                      currency: price.currency,
                    }),
                  })
                  if (!res.ok) {
                    alert("Could not start purchase. Please sign in and try again.")
                    return
                  }
                  const data = await res.json()
                  if (typeof window !== "undefined" && data?.orderId) {
                    // Open Razorpay checkout if SDK is available; otherwise
                    // surface details so the dashboard credits-tab UI can
                    // handle the actual paint.
                    window.dispatchEvent(
                      new CustomEvent("avp:credit-pack-order", { detail: data }),
                    )
                  }
                }}
              >
                Buy pack
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
