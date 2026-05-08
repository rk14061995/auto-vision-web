import "server-only"

import {
  addUserCredit,
  getUserByEmail,
  getUserByReferralCode,
  recordReferralReward,
  updateUser,
  type ReferralMilestone,
  getDb,
} from "./db"
import { grant as grantAiCredits } from "./credits"
import {
  REFERRAL_REWARD_INR,
  REFERRAL_REWARD_USD,
  REFERRAL_AI_CREDIT_BONUS,
  REFERRAL_MILESTONES,
} from "./referrals-config"

interface ApplyReferralRewardArgs {
  orderId: string
  newPaidUserEmail: string
  appliedReferralCode: string | null
  referrerEmail: string | null
  /** "INR" for Razorpay-INR purchases, "USD" otherwise. */
  currency: "INR" | "USD"
  paidCountBefore: number
  /** Optional best-effort signal, used for fraud check. */
  ipHash?: string
}

interface ApplyReferralRewardResult {
  awarded: boolean
  reason?: string
  rewardAmount?: number
  rewardCurrency?: "INR" | "USD"
}

function sameDomain(a: string, b: string): boolean {
  const da = a.split("@")[1]?.toLowerCase()
  const db = b.split("@")[1]?.toLowerCase()
  return !!da && da === db
}

/**
 * Applies first-paid referral rewards to BOTH the referrer and the referred
 * user. Anti-fraud: must be the user's first paid order, distinct email
 * domains, and not self-referral.
 */
export async function applyReferralRewards(
  args: ApplyReferralRewardArgs,
): Promise<ApplyReferralRewardResult> {
  if (
    args.paidCountBefore !== 0 ||
    !args.appliedReferralCode ||
    !args.referrerEmail ||
    args.referrerEmail === args.newPaidUserEmail
  ) {
    return { awarded: false, reason: "ineligible" }
  }

  if (sameDomain(args.referrerEmail, args.newPaidUserEmail)) {
    return { awarded: false, reason: "same_domain" }
  }

  const referrer = await getUserByReferralCode(args.appliedReferralCode)
  if (!referrer || referrer.email !== args.referrerEmail) {
    return { awarded: false, reason: "code_mismatch" }
  }

  const rewardAmount =
    args.currency === "USD" ? REFERRAL_REWARD_USD : REFERRAL_REWARD_INR

  // Cash credits to both parties.
  await addUserCredit({
    email: args.referrerEmail,
    amount: rewardAmount,
    currency: args.currency,
    type: "referral_reward",
    referenceOrderId: args.orderId,
  })
  await addUserCredit({
    email: args.newPaidUserEmail,
    amount: rewardAmount,
    currency: args.currency,
    type: "referral_reward",
    referenceOrderId: args.orderId,
  })

  await recordReferralReward({
    referrerEmail: args.referrerEmail,
    referredEmail: args.newPaidUserEmail,
    orderId: args.orderId,
    rewardAmount,
    currency: args.currency,
  })

  // AI credit bonus to both parties.
  await grantAiCredits(args.referrerEmail, {
    amount: REFERRAL_AI_CREDIT_BONUS,
    source: "admin_grant",
    metadata: { reason: "referral_reward", orderId: args.orderId },
  })
  await grantAiCredits(args.newPaidUserEmail, {
    amount: REFERRAL_AI_CREDIT_BONUS,
    source: "admin_grant",
    metadata: { reason: "referral_referred", orderId: args.orderId },
  })

  await updateUser(args.newPaidUserEmail, { referredByCode: null })

  // Check referrer milestones.
  await maybeAwardMilestones(args.referrerEmail)

  return { awarded: true, rewardAmount, rewardCurrency: args.currency }
}

export async function maybeAwardMilestones(email: string): Promise<ReferralMilestone[]> {
  const referrer = await getUserByEmail(email)
  if (!referrer) return []
  const db = await getDb()
  const referralCount = await db.collection("users").countDocuments({
    referredByCode: referrer.referralCode,
  })
  const newlyAchieved: ReferralMilestone[] = []
  for (const m of REFERRAL_MILESTONES) {
    if (referralCount < m.threshold) continue
    const exists = await db
      .collection<ReferralMilestone>("referral_milestones")
      .findOne({ email, milestoneId: m.id })
    if (exists) continue
    try {
      const inserted = await db
        .collection<ReferralMilestone>("referral_milestones")
        .insertOne({
          email,
          milestoneId: m.id,
          bonusCredits: m.bonusCredits,
          achievedAt: new Date(),
        })
      await grantAiCredits(email, {
        amount: m.bonusCredits,
        source: "admin_grant",
        metadata: { reason: "referral_milestone", milestoneId: m.id },
      })
      newlyAchieved.push({
        _id: inserted.insertedId,
        email,
        milestoneId: m.id,
        bonusCredits: m.bonusCredits,
        achievedAt: new Date(),
      })
    } catch (err: unknown) {
      const code = (err as { code?: number })?.code
      if (code !== 11000) console.error("[referrals] milestone insert failed:", err)
    }
  }
  return newlyAchieved
}

export async function getReferralStats(email: string) {
  const user = await getUserByEmail(email)
  if (!user) return null
  const db = await getDb()
  const [referredCount, milestones, rewardsCount] = await Promise.all([
    db.collection("users").countDocuments({ referredByCode: user.referralCode }),
    db
      .collection<ReferralMilestone>("referral_milestones")
      .find({ email })
      .sort({ achievedAt: -1 })
      .toArray(),
    db.collection("referral_rewards").countDocuments({ referrerEmail: email }),
  ])
  return {
    referralCode: user.referralCode,
    referredCount,
    rewardsCount,
    milestones,
    creditBalanceINR: user.creditBalanceINR ?? 0,
    creditBalanceUSD: user.creditBalanceUSD ?? 0,
  }
}

export async function getReferralLeaderboard(limit = 10) {
  const db = await getDb()
  const results = await db
    .collection("users")
    .aggregate([
      { $match: { referralCode: { $ne: null } } },
      {
        $lookup: {
          from: "users",
          localField: "referralCode",
          foreignField: "referredByCode",
          as: "referred",
        },
      },
      {
        $project: {
          name: 1,
          referralCode: 1,
          referredCount: { $size: "$referred" },
        },
      },
      { $match: { referredCount: { $gt: 0 } } },
      { $sort: { referredCount: -1 } },
      { $limit: limit },
    ])
    .toArray()
  return results.map((doc) => {
    const fullName = (doc.name as string | undefined) ?? ""
    const first = fullName.split(" ")[0] ?? ""
    const lastInitial = fullName.split(" ").slice(1).join(" ")?.charAt(0) ?? ""
    return {
      name: lastInitial ? `${first} ${lastInitial}.` : first || "Anonymous",
      referredCount: doc.referredCount as number,
    }
  })
}
