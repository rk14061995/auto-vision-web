"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { type Plan, formatPrice } from "@/lib/products"
import { type Country } from "@/lib/geo"
import { cn } from "@/lib/utils"
import { trackViewItem, trackBeginCheckout, trackSelectItem, type GA4Item } from "@/lib/gtag"

interface PricingCardProps {
  plan: Plan
  country: Country
  isHighlighted?: boolean
}

export function PricingCard({ plan, country, isHighlighted }: PricingCardProps) {
  const pricing = plan.pricing[country]
  const priceDisplay = formatPrice(pricing.amount, pricing.currency)
  const isEnterprise = pricing.amount === -1
  const isFree = pricing.amount === 0
  const cardRef = useRef<HTMLDivElement>(null)

  const ga4Item: GA4Item = {
    item_id: plan.id,
    item_name: plan.name,
    item_category: "subscription",
    price: pricing.amount > 0 ? pricing.amount : 0,
    currency: pricing.currency,
    quantity: 1,
  }

  // Fire view_item once when the card scrolls into the viewport
  useEffect(() => {
    const el = cardRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          trackViewItem(ga4Item)
          observer.disconnect()
        }
      },
      { threshold: 0.5 }
    )

    observer.observe(el)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan.id])

  function handleCTAClick() {
    trackSelectItem(ga4Item)
    if (!isEnterprise && !isFree) {
      trackBeginCheckout(ga4Item)
    }
  }

  return (
    <div
      ref={cardRef}
      className={cn(
        "relative flex flex-col rounded-xl border p-6 transition-all",
        isHighlighted
          ? "border-primary bg-card shadow-lg shadow-primary/10"
          : "border-border/50 bg-card/50 hover:border-border"
      )}
    >
      {/* Badge */}
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold",
              plan.badge === "popular"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            )}
          >
            {plan.badge === "popular" ? "Most Popular" : "Best Value"}
          </span>
        </div>
      )}

      {/* Plan Name */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{plan.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
      </div>

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-baseline">
          <span className="text-3xl font-bold">{priceDisplay}</span>
          {!isEnterprise && !isFree && (
            <span className="ml-1 text-muted-foreground">/month</span>
          )}
        </div>
        {!isFree && !isEnterprise && (
          <p className="mt-1 text-xs text-muted-foreground">
            Billed monthly. Cancel anytime.
          </p>
        )}
      </div>

      {/* Features */}
      <ul className="mb-6 flex-1 space-y-3">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span className="text-sm text-muted-foreground">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link
        href={isEnterprise ? "#contact" : `/checkout/${plan.id}?country=${country}`}
        onClick={handleCTAClick}
      >
        <Button
          className="w-full"
          variant={isHighlighted ? "default" : "outline"}
        >
          {isEnterprise
            ? "Contact Sales"
            : isFree
            ? "Start Free"
            : "Get Started"}
        </Button>
      </Link>
    </div>
  )
}
