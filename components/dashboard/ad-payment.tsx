"use client"

import { useState } from "react"
import Script from "next/script"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, CreditCard } from "lucide-react"
import { type AdType, formatPrice } from "@/lib/products"
import {
  IndiaGatewaySelector,
  submitPayUForm,
  type IndiaGateway,
} from "@/components/payment/india-gateway"

interface AdPaymentProps {
  adType: AdType
  userEmail: string
  userName: string
  country?: "IN" | "US"
  pendingAdId?: string | null
  onPaymentSuccess: (paymentId: string) => void
  onPaymentCancel: () => void
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void }
  }
}

export function AdPayment({
  adType,
  userEmail,
  userName,
  country = "IN",
  pendingAdId,
  onPaymentSuccess,
  onPaymentCancel,
}: AdPaymentProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [gateway, setGateway] = useState<IndiaGateway>("razorpay")

  const isUS = country === "US"
  const amount = isUS ? adType.pricing.US.amount : adType.pricing.IN.amount
  const currency = isUS ? "USD" : "INR"

  async function handlePayPal() {
    setIsLoading(true)
    try {
      const res = await fetch("/api/paypal/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "ad", adType: adType.id, pendingAdId }),
      })
      const json = await res.json()
      if (!res.ok || !json.approveUrl) throw new Error(json.error || "Could not start checkout")
      window.location.href = json.approveUrl
    } catch (error) {
      toast.error((error as Error).message || "Payment failed. Please try again.")
      setIsLoading(false)
    }
  }

  async function handleRazorpay() {
    setIsLoading(true)
    try {
      const orderRes = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: adType.id, isAdPayment: true, adType: adType.id }),
      })
      if (!orderRes.ok) throw new Error("Failed to create order")
      const orderData = await orderRes.json()
      if (!window.Razorpay) throw new Error("Razorpay SDK not loaded")

      setIsProcessing(true)
      const razorpay = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "AutoVision Pro",
        description: `${adType.name} advertisement — ${adType.duration} days`,
        order_id: orderData.orderId,
        prefill: { name: userName, email: userEmail },
        theme: { color: "#0f172a" },
        handler: async (response: {
          razorpay_order_id: string
          razorpay_payment_id: string
          razorpay_signature: string
        }) => {
          try {
            const verifyRes = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...response, isAdPayment: true, adType: adType.id }),
            })
            if (!verifyRes.ok) throw new Error("Payment verification failed")
            toast.success("Payment successful!")
            onPaymentSuccess(response.razorpay_payment_id)
          } catch {
            toast.error("Payment verification failed.")
            setIsProcessing(false)
            setIsLoading(false)
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false)
            setIsLoading(false)
            onPaymentCancel()
            toast.error("Payment cancelled")
          },
        },
      })
      razorpay.open()
    } catch (error) {
      toast.error("Payment failed. Please try again.")
      setIsProcessing(false)
      setIsLoading(false)
    }
  }

  async function handlePayU() {
    setIsLoading(true)
    try {
      const res = await fetch("/api/payu/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "ad", adType: adType.id }),
      })
      const json = await res.json()
      if (!res.ok || !json.fields) throw new Error(json.error || "Could not start PayU checkout")
      submitPayUForm(json.fields, json.formUrl)
    } catch (error) {
      toast.error((error as Error).message || "Payment failed. Please try again.")
      setIsLoading(false)
    }
  }

  async function handlePay() {
    if (isUS) return handlePayPal()
    if (gateway === "payu") return handlePayU()
    return handleRazorpay()
  }

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg font-medium">Processing your payment...</p>
        <p className="mt-2 text-sm text-muted-foreground">Please do not close this window</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {!isUS && <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />}

      {/* Order summary */}
      <div className="rounded-lg border border-border/50 bg-secondary/30 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{adType.name} Advertisement</p>
            <p className="text-sm text-muted-foreground">{adType.duration} days duration</p>
          </div>
          <p className="text-xl font-bold">{formatPrice(amount, currency)}</p>
        </div>
      </div>

      {/* Gateway selector (India only) */}
      {!isUS && (
        <IndiaGatewaySelector selected={gateway} onChange={setGateway} />
      )}

      <Button onClick={handlePay} disabled={isLoading} className="w-full" size="lg">
        {isLoading ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isUS ? "Redirecting to PayPal…" : gateway === "payu" ? "Redirecting to PayU…" : "Processing…"}
          </>
        ) : (
          <><CreditCard className="mr-2 h-4 w-4" />Pay {formatPrice(amount, currency)}</>
        )}
      </Button>
    </div>
  )
}
