'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Trophy, CheckCircle2, Sparkles, Crown } from 'lucide-react'
import { REFERRAL_REWARD_INR, REFERRAL_REWARD_USD, REFERRAL_AI_CREDIT_BONUS } from '@/lib/referrals-config'

interface MilestoneProgress {
  id: 'ref_3' | 'ref_10' | 'ref_25'
  label: string
  threshold: number
  bonusCredits: number
  achieved: boolean
  progress: number
}

interface ReferralData {
  referralCode: string | null
  referralLink: string
  referredCount: number
  rewardsCount: number
  creditBalanceINR: number
  creditBalanceUSD: number
  milestones: MilestoneProgress[]
}

interface LeaderEntry {
  name: string
  referredCount: number
}

export function ReferEarn() {
  const [data, setData] = useState<ReferralData | null>(null)
  const [leaders, setLeaders] = useState<LeaderEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [refRes, lbRes] = await Promise.all([
          fetch('/api/referrals'),
          fetch('/api/leaderboard/referrals'),
        ])
        if (!refRes.ok) throw new Error('Failed to load referrals')
        const json = (await refRes.json()) as ReferralData
        setData(json)
        if (lbRes.ok) {
          const lbJson = (await lbRes.json()) as { leaders: LeaderEntry[] }
          setLeaders(lbJson.leaders)
        }
      } catch {
        toast.error('Failed to load referral data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

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

  const referralLink = data.referralLink

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(referralLink)
      toast.success('Referral link copied')
    } catch {
      toast.error('Failed to copy')
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-6">
        <h2 className="text-lg font-semibold">Refer & Earn</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Share your link. When your friend makes their first paid purchase, you both get
          ₹{REFERRAL_REWARD_INR}/${REFERRAL_REWARD_USD} in credits PLUS{' '}
          {REFERRAL_AI_CREDIT_BONUS} bonus AI credits each.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
          <Input value={referralLink} readOnly />
          <Button onClick={copyLink}>Copy Link</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border/50 bg-card p-6">
          <p className="text-sm text-muted-foreground">People referred</p>
          <p className="mt-2 text-3xl font-bold">{data.referredCount}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-6">
          <p className="text-sm text-muted-foreground">Conversions</p>
          <p className="mt-2 text-3xl font-bold">{data.rewardsCount}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-6">
          <p className="text-sm text-muted-foreground">Credit balance</p>
          <p className="mt-2 text-xl font-semibold">
            ₹{data.creditBalanceINR}
            <span className="ml-3 text-base text-muted-foreground">${data.creditBalanceUSD}</span>
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card p-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-base font-semibold">Milestones</h3>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {data.milestones.map((m) => (
            <div
              key={m.id}
              className={`rounded-xl border p-4 ${
                m.achieved
                  ? 'border-primary bg-primary/5'
                  : 'border-border/50 bg-card/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="font-medium">{m.label}</p>
                {m.achieved && <CheckCircle2 className="h-4 w-4 text-primary" />}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {m.threshold} referrals → {m.bonusCredits} bonus credits
              </p>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${Math.round(m.progress * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {leaders.length > 0 && (
        <div className="rounded-xl border border-border/50 bg-card p-6">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            <h3 className="text-base font-semibold">Top referrers this month</h3>
          </div>
          <ul className="mt-4 space-y-2">
            {leaders.map((leader, idx) => (
              <li
                key={`${leader.name}-${idx}`}
                className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2 text-sm"
              >
                <span className="flex items-center gap-2">
                  {idx === 0 ? (
                    <Crown className="h-4 w-4 text-amber-500" />
                  ) : (
                    <span className="text-xs text-muted-foreground">#{idx + 1}</span>
                  )}
                  <span className="font-medium">{leader.name}</span>
                </span>
                <span className="text-muted-foreground">{leader.referredCount} referrals</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
