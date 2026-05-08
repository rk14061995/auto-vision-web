"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Script from "next/script"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, CreditCard, Smartphone, Building } from "lucide-react"
import { type Plan, formatPrice } from "@/lib/products"
import { cn } from "@/lib/utils"
import {
  trackBeginCheckout,
  trackAddPaymentInfo,
  trackPurchase,
  trackPaymentInitiated,
  trackPaymentCancelled,
  trackPaymentFailed,
  type GA4Item,
} from "@/lib/gtag"

interface RazorpayCheckoutProps {
  plan: Plan
  userEmail: string
  userName: string
  currency?: "INR" | "USD"
}

type PaymentMethod = "card" | "upi" | "netbanking"

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void
    }
  }
}

export function RazorpayCheckout({
  plan,
  userEmail,
  userName,
  currency = "INR",
}: RazorpayCheckoutProps) {
  const router = useRouter()
  const { update: updateSession } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card")
  const [isProcessing, setIsProcessing] = useState(false)
  const [couponCode, setCouponCode] = useState("")
  const [useCredits, setUseCredits] = useState(true)
  const [quote, setQuote] = useState<null | {
    baseAmount: number
    couponCode: string | null
    couponDiscount: number
    referralDiscount: number
    creditDiscount: number
    finalAmount: number
  }>(null)

  const amount = currency === "INR" ? plan.pricing.IN.amount : plan.pricing.US.amount

  async function refreshQuote() {
    try {
      const res = await fetch("/api/checkout/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          couponCode: couponCode.trim() || undefined,
          useCredits,
          currency,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setQuote(null)
        if (body?.error) toast.error(body.error)
        return
      }

      const data = (await res.json()) as any
      setQuote(data)
    } catch {
      setQuote(null)
      toast.error("Failed to calculate price")
    }
  }

  const ga4Item: GA4Item = {
    item_id: plan.id,
    item_name: plan.name,
    item_category: "subscription",
    price: amount,
    currency: "INR",
    quantity: 1,
  }

  // Fire begin_checkout once when the component mounts (user landed on checkout)
  useState(() => {
    trackBeginCheckout(ga4Item)
  })

  function handlePaymentMethodChange(method: PaymentMethod) {
    setPaymentMethod(method)
    trackAddPaymentInfo(ga4Item, method)
  }

  async function handlePayment() {
    setIsLoading(true)

    try {
      const orderRes = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          couponCode: quote?.couponCode || undefined,
          useCredits,
          currency,
        }),
      })

      if (!orderRes.ok) {
        throw new Error("Failed to create order")
      }

      const orderData = await orderRes.json()
      if (!window.Razorpay) {
        throw new Error("Razorpay SDK not loaded")
      }

      trackPaymentInitiated(plan.id, amount, "INR")
      setIsProcessing(true)

      const razorpay = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "AutoVision Pro",
        description: `${plan.name} subscription`,
        order_id: orderData.orderId,
        prefill: {
          name: userName,
          email: userEmail,
        },
        theme: {
          color: "#0f172a",
        },
        handler: async (response: {
          razorpay_order_id: string
          razorpay_payment_id: string
          razorpay_signature: string
        }) => {
          try {
            const verifyRes = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            })

            if (!verifyRes.ok) {
              throw new Error("Payment verification failed")
            }

            trackPurchase({
              transaction_id: response.razorpay_payment_id,
              value: amount,
              currency: "INR",
              item: ga4Item,
            })
            await updateSession()
            toast.success("Payment successful!")
            router.push("/dashboard")
            router.refresh()
          } catch (verifyError) {
            console.error("Payment verification error:", verifyError)
            trackPaymentFailed(plan.id, "verification_failed")
            toast.error("Payment verification failed.")
            setIsProcessing(false)
            setIsLoading(false)
          }
        },
        modal: {
          ondismiss: () => {
            trackPaymentCancelled(plan.id, amount, "INR")
            setIsProcessing(false)
            setIsLoading(false)
            toast.error("Payment cancelled")
          },
        },
      })

      razorpay.open()
    } catch (error) {
      console.error("Payment error:", error)
      trackPaymentFailed(plan.id, error instanceof Error ? error.message : "unknown_error")
      toast.error("Payment failed. Please try again.")
      setIsProcessing(false)
      setIsLoading(false)
    }
  }

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg font-medium">Processing your payment...</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Please do not close this window
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      {/* Order Summary */}
      <div className="rounded-lg border border-border/50 bg-secondary/30 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{plan.name} Plan</p>
            <p className="text-sm text-muted-foreground">Monthly subscription</p>
          </div>
          <p className="text-xl font-bold">
            {formatPrice((quote?.finalAmount ?? amount), "INR")}
            <span className="text-sm font-normal text-muted-foreground">
              /month
            </span>
          </p>
        </div>

        <div className="mt-4 space-y-3">
          <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="coupon">Coupon</Label>
              <Input
                id="coupon"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Enter coupon code"
              />
            </div>
            <Button type="button" variant="outline" onClick={refreshQuote}>
              Apply
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              checked={useCredits}
              onCheckedChange={(v) => {
                setUseCredits(v === true)
              }}
              id="useCredits"
            />
            <Label htmlFor="useCredits">Use referral credits</Label>
            <Button
              type="button"
              variant="ghost"
              className="ml-auto h-8 px-2"
              onClick={refreshQuote}
            >
              Refresh
            </Button>
          </div>

          {quote && (
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Base</span>
                <span>{formatPrice(quote.baseAmount, currency)}</span>
              </div>
              {quote.couponDiscount > 0 && (
                <div className="flex items-center justify-between">
                  <span>Coupon</span>
                  <span>-{formatPrice(quote.couponDiscount, currency)}</span>
                </div>
              )}
              {quote.referralDiscount > 0 && (
                <div className="flex items-center justify-between">
                  <span>Referral</span>
                  <span>-{formatPrice(quote.referralDiscount, currency)}</span>
                </div>
              )}
              {quote.creditDiscount > 0 && (
                <div className="flex items-center justify-between">
                  <span>Credits</span>
                  <span>-{formatPrice(quote.creditDiscount, currency)}</span>
                </div>
              )}
              <div className="flex items-center justify-between font-medium text-foreground">
                <span>Total</span>
                <span>{formatPrice(quote.finalAmount, currency)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="space-y-3">
        <Label>Payment Method</Label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: "card", label: "Card", icon: CreditCard },
            { id: "upi", label: "UPI", icon: Smartphone },
            { id: "netbanking", label: "Net Banking", icon: Building },
          ].map((method) => (
            <button
              key={method.id}
              onClick={() => handlePaymentMethodChange(method.id as PaymentMethod)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-lg border p-4 transition-all",
                paymentMethod === method.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              )}
            >
              <method.icon className="h-5 w-5" />
              <span className="text-sm font-medium">{method.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Payment Form - Mocked */}
      {paymentMethod === "card" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cardNumber">Card Number</Label>
            <Input
              id="cardNumber"
              placeholder="4111 1111 1111 1111"
              defaultValue="4111 1111 1111 1111"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiry">Expiry</Label>
              <Input id="expiry" placeholder="MM/YY" defaultValue="12/28" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvv">CVV</Label>
              <Input id="cvv" placeholder="123" defaultValue="123" />
            </div>
          </div>
        </div>
      )}

      {paymentMethod === "upi" && (
        <div className="space-y-2">
          <Label htmlFor="upiId">UPI ID</Label>
          <Input
            id="upiId"
            placeholder="yourname@upi"
            defaultValue="test@upi"
          />
        </div>
      )}

      {paymentMethod === "netbanking" && (
        <div className="rounded-lg border border-border/50 bg-secondary/30 p-4 text-center">
          <p className="text-sm text-muted-foreground">
            You will be redirected to your bank&apos;s website
          </p>
        </div>
      )}

      {/* Billing Info */}
      <div className="space-y-4 border-t border-border pt-4">
        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={userEmail} disabled />
        </div>
        <div className="space-y-2">
          <Label>Name</Label>
          <Input value={userName} disabled />
        </div>
      </div>

      {/* Pay Button */}
      <Button
        onClick={handlePayment}
        disabled={isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Pay {formatPrice((quote?.finalAmount ?? amount), "INR")}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        You will be redirected to Razorpay&apos;s secure checkout.
      </p>
    </div>
  )
}
