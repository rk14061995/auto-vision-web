"use client"

import Script from "next/script"
import { Button } from "@/components/ui/button"
import { Loader2, ExternalLink } from "lucide-react"

interface LemonSqueezyButtonProps {
  variantId: string
  email?: string
  planName: string
  discountCode?: string
}

export function LemonSqueezyButton({
  variantId,
  email,
  planName,
  discountCode,
}: LemonSqueezyButtonProps) {
  const storeId = process.env.NEXT_PUBLIC_LEMONSQUEEZY_STORE_ID || "your-store"
  const params = new URLSearchParams()
  if (email) params.set("checkout[email]", email)
  if (discountCode) params.set("discount_code", discountCode)
  const query = params.toString()
  const checkoutUrl = `https://${storeId}.lemonsqueezy.com/checkout/buy/${variantId}${
    query ? `?${query}` : ""
  }`

  return (
    <>
      <Script
        src="https://app.lemonsqueezy.com/js/lemon.js"
        strategy="lazyOnload"
        onLoad={() => {
          // Initialize Lemon.js
          if (typeof window !== "undefined" && "LemonSqueezy" in window) {
            (window as { LemonSqueezy?: { Setup: () => void } }).LemonSqueezy?.Setup()
          }
        }}
      />
      <a
        href={checkoutUrl}
        className="lemonsqueezy-button inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Subscribe to {planName}
        <ExternalLink className="h-4 w-4" />
      </a>
    </>
  )
}

export function LemonSqueezyButtonLoading() {
  return (
    <Button disabled className="w-full gap-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      Loading checkout...
    </Button>
  )
}
