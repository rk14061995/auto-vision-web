"use client"

import Script from "next/script"
import { useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  trackBeginCheckout,
  trackPaymentInitiated,
  trackPaymentCancelled,
  trackPaymentFailed,
  trackAddPaymentInfo,
  trackPayPalButtonRendered,
  trackPayPalButtonClicked,
  trackPayPalSubscriptionCreating,
  trackPayPalPaymentApproved,
  type GA4Item,
} from "@/lib/gtag"

// ─── PayPal SDK types ─────────────────────────────────────────────────────────

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: PayPalButtonsConfig) => PayPalButtonsInstance
      FUNDING: { PAYPAL: string; CARD: string; CREDIT: string }
    }
  }
}

interface PayPalButtonsInstance {
  render: (container: HTMLElement) => Promise<void>
  isEligible: () => boolean
}

interface PayPalButtonsConfig {
  style?: {
    layout?: "vertical" | "horizontal"
    color?: "gold" | "blue" | "silver" | "white" | "black"
    shape?: "rect" | "pill"
    label?: "paypal" | "checkout" | "buynow" | "pay" | "subscribe"
    height?: number
  }
  createSubscription: (
    data: Record<string, unknown>,
    actions: {
      subscription: {
        create: (cfg: { plan_id: string; custom_id?: string }) => Promise<string>
      }
    },
  ) => Promise<string>
  onApprove: (data: { subscriptionID: string; orderID?: string }) => void
  onCancel: (data: Record<string, unknown>) => void
  onError: (err: unknown) => void
  onClick: (data: Record<string, unknown>, actions: { reject: () => void }) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface PayPalButtonProps {
  paypalPlanId: string
  email?: string
  planName: string
  planId: string
  priceUSD: number
  onSuccess?: (subscriptionId: string) => void
  onCancel?: () => void
  onError?: (err: unknown) => void
}

export function PayPalButton({
  paypalPlanId,
  email,
  planName,
  planId,
  priceUSD,
  onSuccess,
  onCancel,
  onError,
}: PayPalButtonProps) {
  const [loading, setLoading] = useState(true)
  const [renderError, setRenderError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? ""

  const ga4Item: GA4Item = {
    item_id: planId,
    item_name: planName,
    item_category: "subscription",
    price: priceUSD,
    currency: "USD",
    quantity: 1,
  }

  function handleSdkLoad() {
    if (!window.paypal || !containerRef.current) return

    window.paypal
      .Buttons({
        style: {
          shape: "pill",
          color: "white",
          layout: "vertical",
          label: "subscribe",
        },
        onClick: (_data, actions) => {
          if (!paypalPlanId) {
            // Plan ID not yet configured in env — block checkout
            setRenderError("Checkout is temporarily unavailable. Please try again later.")
            actions.reject()
            return
          }
          trackBeginCheckout(ga4Item)
          trackPayPalButtonClicked({ planId, planName, priceUSD })
        },
        createSubscription: async (_data, actions) => {
          trackPaymentInitiated(planId, priceUSD, "USD")
          trackAddPaymentInfo(ga4Item, "paypal")
          trackPayPalSubscriptionCreating({ planId, planName, paypalPlanId, priceUSD })
          return actions.subscription.create({
            plan_id: paypalPlanId,
            custom_id: email ?? "",
          })
        },
        onApprove: (data) => {
          trackPayPalPaymentApproved({
            planId,
            planName,
            subscriptionId: data.subscriptionID,
            priceUSD,
          })
          onSuccess?.(data.subscriptionID)
        },
        onCancel: () => {
          trackPaymentCancelled(planId, priceUSD, "USD")
          trackPayPalPaymentCancelled({ planId, planName, paypalPlanId })
          onCancel?.()
        },
        onError: (err) => {
          const errMsg = err instanceof Error ? err.message : String(err)
          trackPaymentFailed(planId, errMsg)
          trackPayPalPaymentError({ planId, planName, errorMessage: errMsg })
          setRenderError("Payment encountered an error. Please try again.")
          onError?.(err)
        },
      })
      .render(containerRef.current)
      .then(() => {
        setLoading(false)
        trackPayPalButtonRendered({ planId, planName, priceUSD })
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err)
        setRenderError("Could not load PayPal checkout.")
        trackPayPalPaymentError({ planId, planName, errorMessage: `render_failed: ${msg}` })
        setLoading(false)
      })
  }

  return (
    <>
      <Script
        src={`https://www.paypal.com/sdk/js?client-id=${clientId}&vault=true&intent=subscription&currency=USD`}
        strategy="lazyOnload"
        onLoad={handleSdkLoad}
        onError={() => {
          setRenderError("Failed to load PayPal SDK. Please refresh and try again.")
          setLoading(false)
          trackPayPalPaymentError({ planId, planName, errorMessage: "sdk_load_failed" })
        }}
      />

      {loading && (
        <Button disabled className="w-full gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading PayPal...
        </Button>
      )}

      {renderError && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {renderError}
        </p>
      )}

      {/* PayPal renders its hosted button into this div */}
      <div ref={containerRef} className={loading ? "hidden" : "block"} />
    </>
  )
}

// ─── Tracking helpers (called internally — not exported from gtag directly) ───

function trackPayPalPaymentCancelled(p: {
  planId: string
  planName: string
  paypalPlanId: string
}) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return
  window.gtag("event", "paypal_payment_cancelled", {
    plan_id: p.planId,
    plan_name: p.planName,
    paypal_plan_id: p.paypalPlanId,
  })
}

function trackPayPalPaymentError(p: {
  planId: string
  planName: string
  errorMessage: string
}) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return
  window.gtag("event", "paypal_payment_error", {
    plan_id: p.planId,
    plan_name: p.planName,
    error_message: p.errorMessage,
  })
}
