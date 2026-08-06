"use client"

import type { ReactNode } from "react"

/** Wraps an outbound ad link and pings /api/ads/track on click, without
 * blocking or delaying navigation. */
export function TrackedAdLink({
  adId,
  href,
  className,
  children,
}: {
  adId: string
  href: string
  className?: string
  children: ReactNode
}) {
  function handleClick() {
    try {
      const body = JSON.stringify({ adId, action: "click" })
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/ads/track", new Blob([body], { type: "application/json" }))
      } else {
        fetch("/api/ads/track", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true })
      }
    } catch {
      // tracking failures should never block the click
    }
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} onClick={handleClick}>
      {children}
    </a>
  )
}
