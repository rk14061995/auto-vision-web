"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, Loader2 } from "lucide-react"
import { PayPalButton } from "@/components/checkout/paypal-button"
import { trackPurchase, type GA4Item } from "@/lib/gtag"

interface PayPalCheckoutProps {
  paypalPlanId: string
  email: string
  planName: string
  planId: string
  priceUSD: number
}

export function PayPalCheckout({
  paypalPlanId,
  email,
  planName,
  planId,
  priceUSD,
}: PayPalCheckoutProps) {
  const router = useRouter()
  const [status, setStatus] = useState<"idle" | "activating" | "success" | "error">("idle")
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  function handleSuccess(sid: string) {
    setSubscriptionId(sid)
    setStatus("activating")

    const ga4Item: GA4Item = {
      item_id: planId,
      item_name: planName,
      item_category: "subscription",
      price: priceUSD,
      currency: "USD",
      quantity: 1,
    }
    trackPurchase({
      transaction_id: sid,
      value: priceUSD,
      currency: "USD",
      item: ga4Item,
    })

    // Webhook activates the account server-side within seconds.
    // Give PayPal a moment then redirect to dashboard.
    setTimeout(() => {
      setStatus("success")
      setTimeout(() => router.push("/dashboard?payment=processing"), 2000)
    }, 1500)
  }

  function handleError(err: unknown) {
    const msg = err instanceof Error ? err.message : "Payment failed. Please try again."
    setErrorMsg(msg)
    setStatus("error")
  }

  if (status === "activating" || status === "success") {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        {status === "activating" ? (
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        ) : (
          <CheckCircle className="h-10 w-10 text-green-500" />
        )}
        <div>
          <p className="text-lg font-semibold">
            {status === "activating" ? "Activating your plan…" : "You're all set!"}
          </p>
          {subscriptionId && (
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              Subscription ID: {subscriptionId}
            </p>
          )}
          <p className="mt-2 text-sm text-muted-foreground">
            {status === "success"
              ? "Redirecting you to the dashboard…"
              : "Your payment was received. Hang tight."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {status === "error" && errorMsg && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorMsg}
        </p>
      )}

      <PayPalButton
        paypalPlanId={paypalPlanId}
        email={email}
        planName={planName}
        planId={planId}
        priceUSD={priceUSD}
        onSuccess={handleSuccess}
        onCancel={() => setStatus("idle")}
        onError={handleError}
      />

      <p className="text-center text-xs text-muted-foreground">
        You&apos;ll be redirected to PayPal to complete your subscription securely.
      </p>
    </div>
  )
}
