"use client"

import { useState, useEffect } from "react"
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs"

interface Props {
  isAtLimit: boolean
  isExpired: boolean | null
  userEmail: string
  userName: string
  defaultCountry: "IN" | "US"
}

export function DashboardTabsWithCountryToggle({
  isAtLimit,
  isExpired,
  userEmail,
  userName,
  defaultCountry,
}: Props) {
  const [country, setCountry] = useState<"IN" | "US">(defaultCountry)

  useEffect(() => {
    const stored = localStorage.getItem("dev_country") as "IN" | "US" | null
    if (stored) setCountry(stored)
  }, [])

  function toggle() {
    const next = country === "IN" ? "US" : "IN"
    setCountry(next)
    localStorage.setItem("dev_country", next)
  }

  return (
    <div className="relative">
      {/* Dev-only toggle */}
      <button
        onClick={toggle}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-yellow-400 bg-yellow-50 px-3 py-1.5 text-xs font-semibold text-yellow-800 shadow-lg hover:bg-yellow-100"
        title="Dev: toggle country"
      >
        <span className="h-2 w-2 rounded-full bg-yellow-400" />
        DEV · {country}
      </button>

      <DashboardTabs
        isAtLimit={isAtLimit}
        isExpired={isExpired}
        userEmail={userEmail}
        userName={userName}
        country={country}
      />
    </div>
  )
}
