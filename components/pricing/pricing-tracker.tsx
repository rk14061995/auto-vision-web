'use client'

import { useEffect, useRef, useState } from 'react'
import { trackScrollDepth, trackExitIntent, type LeadFormTrigger } from '@/lib/gtag'
import { LeadFormModal } from './lead-form-modal'

const TIMER_DELAY_MS = 60_000   // show after 60 s if no other trigger fires
const SCROLL_THRESHOLD = 0.65   // show after scrolling 65% of page height

function alreadySubmitted(): boolean {
  try {
    return localStorage.getItem('av_lead_submitted') === '1'
  } catch {
    return false
  }
}

export function PricingTracker() {
  const [open, setOpen] = useState(false)
  const [trigger, setTrigger] = useState<LeadFormTrigger>('timer')
  const firedRef = useRef(false)
  const depthsFiredRef = useRef(new Set<number>())

  function showModal(t: LeadFormTrigger) {
    if (firedRef.current || alreadySubmitted()) return
    firedRef.current = true
    setTrigger(t)
    setOpen(true)
  }

  // ── Scroll depth tracker ────────────────────────────────────────────────────
  useEffect(() => {
    function onScroll() {
      const scrolled = window.scrollY + window.innerHeight
      const total = document.documentElement.scrollHeight
      const ratio = scrolled / total

      const milestones = [0.25, 0.5, 0.75, 1.0] as const
      for (const m of milestones) {
        if (ratio >= m && !depthsFiredRef.current.has(m)) {
          depthsFiredRef.current.add(m)
          trackScrollDepth((m * 100) as 25 | 50 | 75 | 100, '/pricing')
        }
      }

      if (ratio >= SCROLL_THRESHOLD && !firedRef.current) {
        showModal('scroll_depth')
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Exit intent tracker ─────────────────────────────────────────────────────
  useEffect(() => {
    function onMouseLeave(e: MouseEvent) {
      if (e.clientY <= 20) {
        trackExitIntent('/pricing')
        showModal('exit_intent')
      }
    }
    document.addEventListener('mouseleave', onMouseLeave)
    return () => document.removeEventListener('mouseleave', onMouseLeave)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Timer trigger ───────────────────────────────────────────────────────────
  useEffect(() => {
    const id = setTimeout(() => showModal('timer'), TIMER_DELAY_MS)
    return () => clearTimeout(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!open) return null

  return <LeadFormModal trigger={trigger} onClose={() => setOpen(false)} />
}
