"use client"

import { useState } from "react"
import { LemonSqueezyButton } from "@/components/checkout/lemonsqueezy-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export function LemonCheckout({
  variantId,
  email,
  planName,
}: {
  variantId: string
  email: string
  planName: string
}) {
  const [discountCode, setDiscountCode] = useState("")
  const [appliedCode, setAppliedCode] = useState<string | undefined>(undefined)

  return (
    <div className="space-y-6">
      <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="space-y-2">
          <Label htmlFor="coupon">Coupon</Label>
          <Input
            id="coupon"
            value={discountCode}
            onChange={(e) => setDiscountCode(e.target.value)}
            placeholder="Enter coupon code"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setAppliedCode(discountCode.trim() || undefined)}
        >
          Apply
        </Button>
      </div>

      <LemonSqueezyButton
        variantId={variantId}
        email={email}
        planName={planName}
        discountCode={appliedCode}
      />

      <p className="text-center text-xs text-muted-foreground">
        If your coupon is valid, Lemon Squeezy will apply it on the hosted checkout.
      </p>
    </div>
  )
}
