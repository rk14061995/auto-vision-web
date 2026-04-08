"use client"

import { type Country, getCountryName } from "@/lib/geo"
import { cn } from "@/lib/utils"

interface CountrySelectorProps {
  country: Country
  onChange: (country: Country) => void
}

export function CountrySelector({ country, onChange }: CountrySelectorProps) {
  return (
    <div className="inline-flex items-center rounded-full border border-border bg-card p-1">
      <button
        onClick={() => onChange("US")}
        className={cn(
          "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
          country === "US"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        {getCountryName("US")} ($)
      </button>
      <button
        onClick={() => onChange("IN")}
        className={cn(
          "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
          country === "IN"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        {getCountryName("IN")} (₹)
      </button>
    </div>
  )
}
