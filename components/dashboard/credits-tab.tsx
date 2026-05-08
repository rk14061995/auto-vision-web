"use client"

import { useEffect, useState } from "react"
import { Sparkles, Zap, RotateCcw, Plus, AlertTriangle } from "lucide-react"
import { CREDIT_PACKS } from "@/lib/credit-packs"
import { formatPlanPrice } from "@/lib/plans"

interface BalanceResponse {
  balance: {
    monthly: number
    purchased: number
    total: number
    resetAt: string | null
  }
  transactions: {
    _id: string
    feature: string
    cost: number
    bucket: string
    status: string
    createdAt: string
    metadata?: Record<string, unknown>
  }[]
}

export function CreditsTab({ country }: { country: "IN" | "US" }) {
  const [data, setData] = useState<BalanceResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    try {
      const res = await fetch("/api/credits")
      if (!res.ok) throw new Error("Failed to load credits")
      const json = (await res.json()) as BalanceResponse
      setData(json)
    } catch (err) {
      console.error(err)
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function buy(packId: string) {
    setPurchasing(packId)
    try {
      const res = await fetch("/api/credits/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creditPackId: packId, currency: country === "IN" ? "INR" : "USD" }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Purchase failed")
      // Surface order info; the actual Razorpay popup is opened by the
      // existing razorpay-checkout component on /checkout. For now show
      // success message.
      alert(`Order created (${json.orderId}). Open the Razorpay popup to finish.`)
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setPurchasing(null)
    }
  }

  if (loading) {
    return <div className="text-muted-foreground">Loading credits...</div>
  }
  if (error || !data) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
        <AlertTriangle className="mr-2 inline h-4 w-4" />
        {error ?? "Could not load credits"}
      </div>
    )
  }

  const reset = data.balance.resetAt ? new Date(data.balance.resetAt) : null

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-primary/40 bg-primary/5 p-5">
          <div className="flex items-center gap-2 text-sm text-primary">
            <Zap className="h-4 w-4" />
            <span>Total credits</span>
          </div>
          <p className="mt-2 text-3xl font-bold">{data.balance.total}</p>
          <p className="text-xs text-muted-foreground">monthly + purchased</p>
        </div>
        <div className="rounded-2xl border border-border/50 bg-card/50 p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RotateCcw className="h-4 w-4" />
            <span>Monthly bucket</span>
          </div>
          <p className="mt-2 text-3xl font-bold">{data.balance.monthly}</p>
          <p className="text-xs text-muted-foreground">
            resets {reset ? reset.toLocaleDateString() : "soon"}
          </p>
        </div>
        <div className="rounded-2xl border border-border/50 bg-card/50 p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Plus className="h-4 w-4" />
            <span>Purchased credits</span>
          </div>
          <p className="mt-2 text-3xl font-bold">{data.balance.purchased}</p>
          <p className="text-xs text-muted-foreground">never expire</p>
        </div>
      </div>

      <div>
        <h3 className="text-base font-semibold">Top up</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {CREDIT_PACKS.map((pack) => {
            const price = country === "IN" ? pack.pricing.IN : pack.pricing.US
            return (
              <div
                key={pack.id}
                className={`rounded-xl border p-4 ${
                  pack.highlight ? "border-primary bg-card" : "border-border/50 bg-card/50"
                }`}
              >
                <p className="text-2xl font-bold">{pack.credits.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">credits</p>
                <p className="mt-2 text-lg font-semibold">
                  {formatPlanPrice(price.amount, price.currency)}
                </p>
                <button
                  type="button"
                  className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                  disabled={purchasing === pack.id}
                  onClick={() => buy(pack.id)}
                >
                  {purchasing === pack.id ? "Starting..." : "Buy"}
                </button>
                {pack.highlight && (
                  <p className="mt-2 inline-flex items-center gap-1 text-xs text-primary">
                    <Sparkles className="h-3 w-3" /> {pack.highlight}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <h3 className="text-base font-semibold">Recent activity</h3>
        {data.transactions.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No transactions yet.</p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-xl border border-border/50">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Feature</th>
                  <th className="px-3 py-2">Bucket</th>
                  <th className="px-3 py-2">Cost</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map((t) => (
                  <tr key={t._id} className="border-t border-border/30">
                    <td className="px-3 py-2">{t.feature}</td>
                    <td className="px-3 py-2 capitalize">{t.bucket}</td>
                    <td className="px-3 py-2">{t.cost > 0 ? `-${t.cost}` : `+${-t.cost}`}</td>
                    <td className="px-3 py-2 capitalize">{t.status}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {new Date(t.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
