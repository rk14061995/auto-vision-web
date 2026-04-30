'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface ReferralData {
  referralCode: string | null
  referralLink: string
  referredCount: number
  rewardsCount: number
  creditBalanceINR: number
  creditBalanceUSD: number
}

export function ReferEarn({ userEmail }: { userEmail: string }) {
  const [data, setData] = useState<ReferralData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/referrals')
        if (!res.ok) throw new Error('Failed to load')
        const json = (await res.json()) as ReferralData
        setData(json)
      } catch {
        toast.error('Failed to load referral data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const referralLink = data?.referralLink || ''

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(referralLink)
      toast.success('Referral link copied')
    } catch {
      toast.error('Failed to copy')
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <p className="text-muted-foreground">No data</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <h2 className="text-lg font-semibold">Refer & Earn</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Share your link. When your friend completes their first paid purchase, you earn credits.
        </p>

        <div className="mt-6 space-y-3">
          <div className="space-y-2">
            <p className="text-sm font-medium">Your referral code</p>
            <Input value={data.referralCode || ''} readOnly />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Your referral link</p>
            <Input value={referralLink} readOnly />
          </div>

          <div className="flex gap-2">
            <Button onClick={copyLink}>Copy Link</Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border/50 bg-card p-6">
          <p className="text-sm text-muted-foreground">People referred</p>
          <p className="mt-2 text-2xl font-bold">{data.referredCount}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-6">
          <p className="text-sm text-muted-foreground">Referral rewards earned</p>
          <p className="mt-2 text-2xl font-bold">{data.rewardsCount}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card p-6">
        <p className="text-sm text-muted-foreground">Your credit balance</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">INR credits</p>
            <p className="text-xl font-semibold">₹{data.creditBalanceINR}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">USD credits</p>
            <p className="text-xl font-semibold">${data.creditBalanceUSD}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card p-6">
        <p className="text-sm font-medium">How it works</p>
        <div className="mt-2 text-sm text-muted-foreground space-y-1">
          <p>Your friend gets 10% off their first purchase when they sign up using your link.</p>
          <p>You earn ₹200 / $5 credits after their first successful payment.</p>
        </div>
      </div>
    </div>
  )
}
