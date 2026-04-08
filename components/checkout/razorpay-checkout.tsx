"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, CreditCard, Smartphone, Building } from "lucide-react"
import { type Plan, formatPrice } from "@/lib/products"
import { generateMockPaymentResponse } from "@/lib/razorpay"
import { cn } from "@/lib/utils"

interface RazorpayCheckoutProps {
  plan: Plan
  userEmail: string
  userName: string
}

type PaymentMethod = "card" | "upi" | "netbanking"

export function RazorpayCheckout({
  plan,
  userEmail,
  userName,
}: RazorpayCheckoutProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card")
  const [isProcessing, setIsProcessing] = useState(false)

  const amount = plan.pricing.IN.amount

  async function handlePayment() {
    setIsLoading(true)

    try {
      // Create order
      const orderRes = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id }),
      })

      if (!orderRes.ok) {
        throw new Error("Failed to create order")
      }

      const orderData = await orderRes.json()

      // Simulate payment processing
      setIsProcessing(true)
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Generate mock payment response
      const paymentResponse = generateMockPaymentResponse(orderData.orderId)

      // Verify payment
      const verifyRes = await fetch("/api/razorpay/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          ...paymentResponse,
        }),
      })

      if (!verifyRes.ok) {
        throw new Error("Payment verification failed")
      }

      toast.success("Payment successful!")
      router.push("/dashboard")
      router.refresh()
    } catch (error) {
      console.error("Payment error:", error)
      toast.error("Payment failed. Please try again.")
    } finally {
      setIsLoading(false)
      setIsProcessing(false)
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
      {/* Order Summary */}
      <div className="rounded-lg border border-border/50 bg-secondary/30 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{plan.name} Plan</p>
            <p className="text-sm text-muted-foreground">Monthly subscription</p>
          </div>
          <p className="text-xl font-bold">
            {formatPrice(amount, "INR")}
            <span className="text-sm font-normal text-muted-foreground">
              /month
            </span>
          </p>
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
              onClick={() => setPaymentMethod(method.id as PaymentMethod)}
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
        Pay {formatPrice(amount, "INR")}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        This is a demo checkout. No real payment will be processed.
      </p>
    </div>
  )
}
