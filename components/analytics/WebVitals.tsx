'use client'

import { useEffect } from 'react'
import { trackWebVital, type WebVitalName, type WebVitalRating } from '@/lib/gtag'

const THRESHOLDS: Record<WebVitalName, [number, number]> = {
  LCP:  [2500, 4000],
  CLS:  [0.1,  0.25],
  FCP:  [1800, 3000],
  TTFB: [800,  1800],
  INP:  [200,  500],
}

function getRating(name: WebVitalName, value: number): WebVitalRating {
  const [good, poor] = THRESHOLDS[name]
  if (value <= good) return 'good'
  if (value <= poor) return 'needs-improvement'
  return 'poor'
}

export function WebVitals() {
  useEffect(() => {
    if (typeof PerformanceObserver === 'undefined') return

    const observers: PerformanceObserver[] = []

    function observe(type: string, cb: (entries: PerformanceObserverEntryList) => void) {
      try {
        const obs = new PerformanceObserver(cb)
        obs.observe({ type, buffered: true })
        observers.push(obs)
      } catch {
        // entry type not supported in this browser
      }
    }

    // LCP — fires repeatedly, last value wins
    observe('largest-contentful-paint', (list) => {
      const entries = list.getEntries()
      const last = entries[entries.length - 1] as PerformanceEntry & { renderTime?: number; loadTime?: number }
      const value = last.renderTime || last.loadTime || last.startTime
      trackWebVital('LCP', value, getRating('LCP', value))
    })

    // CLS — accumulate all layout-shift entries
    let clsValue = 0
    observe('layout-shift', (list) => {
      for (const entry of list.getEntries()) {
        const ls = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number }
        if (!ls.hadRecentInput) clsValue += ls.value ?? 0
      }
      trackWebVital('CLS', clsValue, getRating('CLS', clsValue))
    })

    // FCP
    observe('paint', (list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          trackWebVital('FCP', entry.startTime, getRating('FCP', entry.startTime))
        }
      }
    })

    // TTFB via navigation timing
    observe('navigation', (list) => {
      const nav = list.getEntries()[0] as PerformanceNavigationTiming | undefined
      if (nav) {
        const ttfb = nav.responseStart - nav.requestStart
        trackWebVital('TTFB', ttfb, getRating('TTFB', ttfb))
      }
    })

    // INP (Interaction to Next Paint) — available in Chrome 96+
    observe('event', (list) => {
      let maxDuration = 0
      for (const entry of list.getEntries()) {
        const e = entry as PerformanceEventTiming
        const duration = e.processingEnd - e.startTime
        if (duration > maxDuration) maxDuration = duration
      }
      if (maxDuration > 0) {
        trackWebVital('INP', maxDuration, getRating('INP', maxDuration))
      }
    })

    return () => observers.forEach((obs) => obs.disconnect())
  }, [])

  return null
}
