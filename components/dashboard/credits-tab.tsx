"use client"

import { useEffect, useState } from "react"
import Script from "next/script"
import { Sparkles, Zap, RotateCcw, Plus, AlertTriangle, EyeOff, CheckCircle, Loader2 } from "lucide-react"
import { CREDIT_PACKS } from "@/lib/credit-packs"
import { formatPlanPrice } from "@/lib/plans"
import { IndiaGatewaySelector, submitPayUForm, type IndiaGateway } from "@/components/payment/india-gateway"

declare global {
  interface Window {
    Razorpay: new (opts: Record<string, unknown>) => { open(): void }
  }
}

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
  adFree: boolean
}

export function CreditsTab({ country }: { country: "IN" | "US" }) {
  const [data, setData] = useState<BalanceResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [gateway, setGateway] = useState<IndiaGateway>("razorpay")

  async function load() {
    try {
      const res = await fetch("/api/credits")
      if (!res.ok) throw new Error("Failed to load credits")
      setData(await res.json() as BalanceResponse)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function launchRazorpay(packId: string) {
    const orderRes = await fetch("/api/razorpay/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "credit_pack", creditPackId: packId, currency: "INR" }),
    })
    const orderData = await orderRes.json()
    if (!orderRes.ok) throw new Error(orderData.error || "Failed to create order")
    if (!window.Razorpay) throw new Error("Razorpay SDK not loaded")

    return new Promise<void>((resolve, reject) => {
      const rzp = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "AutoVision Pro",
        description: `AI Credit Pack (${orderData.credits} credits)`,
        order_id: orderData.orderId,
        theme: { color: "#0f172a" },
        handler: async (response: {
          razorpay_order_id: string
          razorpay_payment_id: string
          razorpay_signature: string
        }) => {
          try {
            const vRes = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...response, kind: "credit_pack" }),
            })
            if (!vRes.ok) throw new Error("Verification failed")
            await load()
            resolve()
          } catch (e) { reject(e) }
        },
        modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
      })
      rzp.open()
    })
  }

  async function launchPayU(packId: string) {
    const res = await fetch("/api/payu/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "credit_pack", creditPackId: packId }),
    })
    const json = await res.json()
    if (!res.ok || !json.fields) throw new Error(json.error || "Could not start PayU checkout")
    submitPayUForm(json.fields, json.formUrl)
  }

  async function buy(packId: string) {
    setPurchasing(packId)
    try {
      if (country === "US") {
        const res = await fetch("/api/paypal/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: "credit_pack", creditPackId: packId }),
        })
        const json = await res.json()
        if (!res.ok || !json.approveUrl) throw new Error(json.error || "Could not start checkout")
        window.location.href = json.approveUrl
      } else if (gateway === "payu") {
        await launchPayU(packId)
      } else {
        await launchRazorpay(packId)
      }
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setPurchasing(null)
    }
  }

  async function buyAdFree() {
    setPurchasing("ad_free")
    try {
      if (country === "US") {
        const res = await fetch("/api/paypal/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: "ad_free" }),
        })
        const json = await res.json()
        if (!res.ok || !json.approveUrl) throw new Error(json.error || "Could not start checkout")
        window.location.href = json.approveUrl
      } else if (gateway === "payu") {
        // ad_free is a fixed ₹99 item — map to ad kind with a sentinel
        const res = await fetch("/api/razorpay/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: "ad_free", currency: "INR" }),
        })
        const orderData = await res.json()
        if (!res.ok) throw new Error(orderData.error || "Failed to create order")
        if (!window.Razorpay) throw new Error("Razorpay SDK not loaded")
        const rzp = new window.Razorpay({
          key: orderData.keyId, amount: orderData.amount, currency: orderData.currency,
          name: "AutoVision Pro", description: "Go Ad-Free (one-time)", order_id: orderData.orderId,
          theme: { color: "#0f172a" },
          handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
            await fetch("/api/razorpay/verify", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...response, kind: "ad_free" }),
            })
            await load()
          },
          modal: { ondismiss: () => setPurchasing(null) },
        })
        rzp.open()
        return
      } else {
        const res = await fetch("/api/razorpay/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: "ad_free", currency: "INR" }),
        })
        const orderData = await res.json()
        if (!res.ok) throw new Error(orderData.error || "Failed to create order")
        if (!window.Razorpay) throw new Error("Razorpay SDK not loaded")
        const rzp = new window.Razorpay({
          key: orderData.keyId, amount: orderData.amount, currency: orderData.currency,
          name: "AutoVision Pro", description: "Go Ad-Free (one-time)", order_id: orderData.orderId,
          theme: { color: "#0f172a" },
          handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
            await fetch("/api/razorpay/verify", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...response, kind: "ad_free" }),
            })
            await load()
          },
          modal: { ondismiss: () => setPurchasing(null) },
        })
        rzp.open()
        return
      }
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setPurchasing(null)
    }
  }

  if (loading) return <div className="text-muted-foreground">Loading credits...</div>
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
      {country === "IN" && <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-primary/40 bg-primary/5 p-5">
          <div className="flex items-center gap-2 text-sm text-primary">
            <Zap className="h-4 w-4" /><span>Total credits</span>
          </div>
          <p className="mt-2 text-3xl font-bold">{data.balance.total}</p>
          <p className="text-xs text-muted-foreground">monthly + purchased</p>
        </div>
        <div className="rounded-2xl border border-border/50 bg-card/50 p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RotateCcw className="h-4 w-4" /><span>Monthly bucket</span>
          </div>
          <p className="mt-2 text-3xl font-bold">{data.balance.monthly}</p>
          <p className="text-xs text-muted-foreground">resets {reset ? reset.toLocaleDateString() : "soon"}</p>
        </div>
        <div className="rounded-2xl border border-border/50 bg-card/50 p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Plus className="h-4 w-4" /><span>Purchased credits</span>
          </div>
          <p className="mt-2 text-3xl font-bold">{data.balance.purchased}</p>
          <p className="text-xs text-muted-foreground">never expire</p>
        </div>
      </div>

      {/* Gateway selector for IN users */}
      {country === "IN" && (
        <IndiaGatewaySelector selected={gateway} onChange={setGateway} />
      )}

      <div>
        <h3 className="text-base font-semibold">Top up</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {CREDIT_PACKS.map((pack) => {
            const price = country === "IN" ? pack.pricing.IN : pack.pricing.US
            return (
              <div
                key={pack.id}
                className={`rounded-xl border p-4 ${pack.highlight ? "border-primary bg-card" : "border-border/50 bg-card/50"}`}
              >
                <p className="text-2xl font-bold">{pack.credits.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">credits</p>
                <p className="mt-2 text-lg font-semibold">{formatPlanPrice(price.amount, price.currency)}</p>
                <button
                  type="button"
                  className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                  disabled={purchasing === pack.id}
                  onClick={() => buy(pack.id)}
                >
                  {purchasing === pack.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {purchasing === pack.id ? "Processing…" : "Buy"}
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

      <div className="rounded-2xl border border-border/50 bg-card/50 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <EyeOff className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">Go Ad-Free</h3>
              {data.adFree && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                  <CheckCircle className="h-3 w-3" /> Active
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.adFree
                ? "You have a permanent ad-free experience. No ads will be shown."
                : "Remove all ads across the platform — one-time payment, never expires."}
            </p>
            {!data.adFree && <p className="mt-1 text-lg font-bold">{country === "US" ? "$19" : "₹99"}</p>}
          </div>
          {!data.adFree && (
            <button
              type="button"
              className="shrink-0 inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              disabled={purchasing === "ad_free"}
              onClick={buyAdFree}
            >
              {purchasing === "ad_free" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {purchasing === "ad_free" ? "Processing…" : "Remove Ads"}
            </button>
          )}
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
                    <td className="px-3 py-2 text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleString()}</td>
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
