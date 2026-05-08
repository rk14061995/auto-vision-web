import "server-only"

import {
  applyPlanPurchase,
  getDb,
  getUserByEmail,
  type BillingCycle,
  type PlanTier,
  type User,
} from "./db"
import {
  PLAN_BY_TIER,
  billingCycleMonths,
  getPlanPrice,
  isHigherTier,
  planRank,
} from "./plans"
import { resolveTier } from "./feature-flags"

export interface ProrationResult {
  /** Net amount the user will be charged now. Negative => credit due. */
  amount: number
  currency: "INR" | "USD"
  reason:
    | "no_change"
    | "upgrade_charge"
    | "downgrade_credit"
    | "cycle_change"
    | "free_to_paid"
}

const GRACE_PERIOD_DAYS = 3

interface UpgradeArgs {
  email: string
  newTier: PlanTier
  cycle: BillingCycle
}

export function computeProration(
  user: Pick<User, "planType" | "planTier" | "billingCycle" | "subscriptionExpiry">,
  newTier: PlanTier,
  newCycle: BillingCycle,
  country: "IN" | "US",
): ProrationResult {
  const currentTier = resolveTier(user)
  const currency = country === "IN" ? "INR" : "USD"

  if (currentTier === newTier && (user.billingCycle ?? "monthly") === newCycle) {
    return { amount: 0, currency, reason: "no_change" }
  }

  const newPlan = PLAN_BY_TIER[newTier]
  if (newPlan.pricing[country].amount < 0) {
    return { amount: 0, currency, reason: "no_change" }
  }
  const newPrice = getPlanPrice(newPlan, country, newCycle).amount
  if (newPrice === 0) {
    return { amount: 0, currency, reason: "no_change" }
  }

  if (currentTier === "free") {
    return { amount: newPrice, currency, reason: "free_to_paid" }
  }

  const currentPlan = PLAN_BY_TIER[currentTier]
  const currentCycle: BillingCycle = user.billingCycle ?? "monthly"
  const currentPrice = getPlanPrice(currentPlan, country, currentCycle).amount

  // Days remaining on the current cycle.
  const now = Date.now()
  const expiry = user.subscriptionExpiry ? new Date(user.subscriptionExpiry).getTime() : now
  const daysRemaining = Math.max(0, (expiry - now) / (1000 * 60 * 60 * 24))
  const cycleDays = billingCycleMonths(currentCycle) * 30
  const ratio = cycleDays > 0 ? Math.min(1, daysRemaining / cycleDays) : 0

  const unusedCredit = Math.round(currentPrice * ratio * 100) / 100
  const netCharge = Math.max(0, Math.round((newPrice - unusedCredit) * 100) / 100)

  if (isHigherTier(newTier, currentTier)) {
    return {
      amount: netCharge,
      currency,
      reason: "upgrade_charge",
    }
  }
  // Downgrades (lower tier or same tier with shorter cycle) issue an account
  // credit equal to the unused portion of the current plan; user keeps current
  // tier until cycle end.
  return {
    amount: -unusedCredit,
    currency,
    reason: "downgrade_credit",
  }
}

export interface ApplyUpgradeResult {
  applied: boolean
  proration: ProrationResult
  needsPayment: boolean
  user?: User | null
}

/**
 * Immediately upgrade the user's plan tier when proration shows the user owes
 * 0 (or a credit). When a charge is required, the caller should redirect to a
 * checkout flow to collect the delta amount; this function does NOT process
 * payments itself.
 */
export async function applyUpgrade(args: UpgradeArgs): Promise<ApplyUpgradeResult> {
  const user = await getUserByEmail(args.email)
  if (!user) return { applied: false, proration: { amount: 0, currency: "INR", reason: "no_change" }, needsPayment: false }

  const country: "IN" | "US" = user.country === "US" ? "US" : "IN"
  const proration = computeProration(user, args.newTier, args.cycle, country)

  if (proration.amount > 0) {
    return { applied: false, proration, needsPayment: true, user }
  }

  // No charge required (downgrade credit or free upgrade): apply immediately.
  const updated = await applyPlanPurchase(args.email, args.newTier, "internal_upgrade", {
    cycle: args.cycle,
    provider: "razorpay",
  })
  return { applied: true, proration, needsPayment: false, user: updated }
}

export async function scheduleDowngrade(args: UpgradeArgs): Promise<User | null> {
  const user = await getUserByEmail(args.email)
  if (!user) return null
  const currentTier = resolveTier(user)
  if (planRank(args.newTier) >= planRank(currentTier)) {
    return user // not a downgrade
  }
  const expiry = user.subscriptionExpiry ?? new Date()
  const db = await getDb()
  const result = await db.collection<User>("users").findOneAndUpdate(
    { email: args.email },
    {
      $set: {
        pendingDowngradeTo: args.newTier,
        pendingDowngradeAt: expiry,
        billingCycle: args.cycle,
        updatedAt: new Date(),
      },
    },
    { returnDocument: "after" },
  )
  return result
}

export async function applyCancellation(email: string): Promise<User | null> {
  const user = await getUserByEmail(email)
  if (!user) return null
  const expiry = user.subscriptionExpiry ?? new Date()
  const db = await getDb()
  const result = await db.collection<User>("users").findOneAndUpdate(
    { email },
    {
      $set: {
        pendingDowngradeTo: "free",
        pendingDowngradeAt: expiry,
        updatedAt: new Date(),
      },
    },
    { returnDocument: "after" },
  )
  return result
}

/**
 * Run periodically (cron). Applies pending downgrades whose
 * pendingDowngradeAt has elapsed plus the grace period, and clears stale
 * subscriptions. Returns counts.
 */
export async function processGracePeriod(): Promise<{
  downgraded: number
  expired: number
}> {
  const db = await getDb()
  const now = new Date()
  const cutoff = new Date(now.getTime() - GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000)

  const candidates = await db
    .collection<User>("users")
    .find({
      pendingDowngradeAt: { $lte: cutoff },
      pendingDowngradeTo: { $ne: null },
    })
    .toArray()

  let downgraded = 0
  for (const user of candidates) {
    const target = user.pendingDowngradeTo as PlanTier
    const tierPlan = PLAN_BY_TIER[target]
    await db.collection<User>("users").updateOne(
      { email: user.email },
      {
        $set: {
          planType: target,
          planTier: target,
          projectLimit: tierPlan.projectLimit,
          aiCreditsMonthly: tierPlan.monthlyAiCredits,
          billingCycle: target === "free" ? null : user.billingCycle,
          pendingDowngradeTo: null,
          pendingDowngradeAt: null,
          dunning: false,
          updatedAt: now,
        },
      },
    )
    downgraded += 1
  }

  // Expire dangling subscriptions (no pendingDowngrade but past expiry by
  // more than grace period).
  const expiredResult = await db.collection<User>("users").updateMany(
    {
      planType: { $nin: ["free"] },
      subscriptionExpiry: { $lte: cutoff },
      pendingDowngradeTo: null,
    },
    {
      $set: {
        planType: "free",
        planTier: "free",
        projectLimit: PLAN_BY_TIER.free.projectLimit,
        aiCreditsMonthly: PLAN_BY_TIER.free.monthlyAiCredits,
        billingCycle: null,
        dunning: false,
        updatedAt: now,
      },
    },
  )

  return { downgraded, expired: expiredResult.modifiedCount }
}
