"use client"

import { useState } from "react"
import Script from "next/script"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, CreditCard, Smartphone, Building } from "lucide-react"
import { type AdType, formatPrice } from "@/lib/products"
import { cn } from "@/lib/utils"

interface AdPaymentProps {
  adType: AdType
  userEmail: string
  userName: string
  onPaymentSuccess: (paymentId: string) => void
  onPaymentCancel: () => void
}

type PaymentMethod = "card" | "upi" | "netbanking"

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void
    }
  }
}

export function AdPayment({
  adType,
  userEmail,
  userName,
  onPaymentSuccess,
  onPaymentCancel,
}: AdPaymentProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card")
  const [isProcessing, setIsProcessing] = useState(false)

  const amount = adType.pricing.IN.amount

  async function handlePayment() {
    setIsLoading(true)

    try {
      // Create order for advertisement
      const orderRes = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: adType.id, // We'll modify the API to handle ad types
          isAdPayment: true,
          adType: adType.id
        }),
      })

      if (!orderRes.ok) {
        throw new Error("Failed to create order")
      }

      const orderData = await orderRes.json()
      if (!window.Razorpay) {
        throw new Error("Razorpay SDK not loaded")
      }

      setIsProcessing(true)
      const razorpay = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "AutoVision Pro",
        description: `${adType.name} advertisement - ${adType.duration} days`,
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
              body: JSON.stringify({
                ...response,
                isAdPayment: true,
                adType: adType.id
              }),
            })

            if (!verifyRes.ok) {
              throw new Error("Payment verification failed")
            }

            toast.success("Payment successful!")
            onPaymentSuccess(response.razorpay_payment_id)
          } catch (verifyError) {
            console.error("Payment verification error:", verifyError)
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
      console.error("Payment error:", error)
      toast.error("Payment failed. Please try again.")
      setIsProcessing(false)
      setIsLoading(false)
    } finally {
      // Controlled in handler/modal callbacks.
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
            <p className="font-medium">{adType.name} Advertisement</p>
            <p className="text-sm text-muted-foreground">{adType.duration} days duration</p>
          </div>
          <p className="text-xl font-bold">
            {formatPrice(amount, "INR")}
          </p>
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Payment Method</Label>
        <div className="grid grid-cols-3 gap-3">
          <Button
            type="button"
            variant={paymentMethod === "card" ? "default" : "outline"}
            className={cn(
              "flex flex-col items-center gap-2 h-auto py-4",
              paymentMethod === "card" && "border-primary"
            )}
            onClick={() => setPaymentMethod("card")}
          >
            <CreditCard className="h-5 w-5" />
            <span className="text-xs">Card</span>
          </Button>
          <Button
            type="button"
            variant={paymentMethod === "upi" ? "default" : "outline"}
            className={cn(
              "flex flex-col items-center gap-2 h-auto py-4",
              paymentMethod === "upi" && "border-primary"
            )}
            onClick={() => setPaymentMethod("upi")}
          >
            <Smartphone className="h-5 w-5" />
            <span className="text-xs">UPI</span>
          </Button>
          <Button
            type="button"
            variant={paymentMethod === "netbanking" ? "default" : "outline"}
            className={cn(
              "flex flex-col items-center gap-2 h-auto py-4",
              paymentMethod === "netbanking" && "border-primary"
            )}
            onClick={() => setPaymentMethod("netbanking")}
          >
            <Building className="h-5 w-5" />
            <span className="text-xs">Net Banking</span>
          </Button>
        </div>
      </div>

      {/* Pay Button */}
      <Button
        onClick={handlePayment}
        disabled={isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Pay {formatPrice(amount, "INR")}
          </>
        )}
      </Button>
    </div>
  )
}