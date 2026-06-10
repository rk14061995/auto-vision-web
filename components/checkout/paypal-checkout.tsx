"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { trackBeginCheckout, trackPaymentInitiated, type GA4Item } from "@/lib/gtag"

interface PayPalCheckoutProps {
  paypalPlanId: string
  email: string
  planName: string
  planId: string
  priceUSD: number
}

export function PayPalCheckout({
  planName,
  planId,
  priceUSD,
}: PayPalCheckoutProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const ga4Item: GA4Item = {
    item_id: planId,
    item_name: planName,
    item_category: "subscription",
    price: priceUSD,
    currency: "USD",
    quantity: 1,
  }

  async function handleClick() {
    setLoading(true)
    setError(null)
    trackBeginCheckout(ga4Item)
    trackPaymentInitiated(planId, priceUSD, "USD")

    try {
      const res = await fetch("/api/paypal/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      })

      const data = await res.json()

      if (!res.ok || !data.approveUrl) {
        setError(data.error ?? "Could not start checkout. Please try again.")
        setLoading(false)
        return
      }

      // Redirect to PayPal hosted approval page
      window.location.href = data.approveUrl
    } catch {
      setError("Network error. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button
        onClick={handleClick}
        disabled={loading}
        className="w-full gap-2 bg-[#0070ba] hover:bg-[#003087] text-white"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Redirecting to PayPal...
          </>
        ) : (
          <>
            <PayPalIcon />
            Subscribe with PayPal
          </>
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        You&apos;ll be redirected to PayPal to complete your subscription securely.
      </p>
    </div>
  )
}

function PayPalIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.59 3.025-2.566 6.643-8.993 6.643H9.39l-1.298 8.232h3.364c.458 0 .85-.333.922-.784l.038-.196.732-4.638.047-.255a.932.932 0 0 1 .922-.784h.58c3.758 0 6.698-1.527 7.554-5.944.359-1.847.173-3.39-.629-4.987z"/>
    </svg>
  )
}
