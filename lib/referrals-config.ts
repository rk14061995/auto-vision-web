// Configurable referral reward amounts and milestones.

export const REFERRAL_REWARD_INR = 100
export const REFERRAL_REWARD_USD = 3

/** Bonus AI credits granted to both parties when a referral converts. */
export const REFERRAL_AI_CREDIT_BONUS = 25

export interface ReferralMilestoneDef {
  id: "ref_3" | "ref_10" | "ref_25"
  threshold: number
  bonusCredits: number
  label: string
}

export const REFERRAL_MILESTONES: ReferralMilestoneDef[] = [
  { id: "ref_3", threshold: 3, bonusCredits: 50, label: "Starter Hustler" },
  { id: "ref_10", threshold: 10, bonusCredits: 200, label: "Power Referrer" },
  { id: "ref_25", threshold: 25, bonusCredits: 750, label: "Brand Ambassador" },
]
