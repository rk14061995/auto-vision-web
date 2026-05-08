import "server-only"

import { ObjectId } from "mongodb"
import {
  getDb,
  type AICreditBucket,
  type AICreditFeature,
  type AICreditTransaction,
  type User,
} from "./db"
import { resolveTier } from "./feature-flags"
import { PLAN_BY_TIER } from "./plans"

export interface CreditBalance {
  monthly: number
  purchased: number
  total: number
  resetAt: Date | null
}

interface DebitInput {
  feature: AICreditFeature
  cost: number
  idempotencyKey?: string
  metadata?: Record<string, unknown>
}

export interface DebitSuccess {
  ok: true
  transactionId: string
  bucket: AICreditBucket | "mixed"
  balanceBefore: { monthly: number; purchased: number }
  balanceAfter: { monthly: number; purchased: number }
}

export interface DebitFailure {
  ok: false
  reason: "insufficient" | "no_user" | "duplicate"
  available?: { monthly: number; purchased: number }
  existingTransactionId?: string
}

export type DebitResult = DebitSuccess | DebitFailure

/**
 * Resets the monthly bucket back to the user's plan default if the reset
 * window has elapsed. Idempotent. Returns the latest balance.
 */
export async function getBalance(email: string): Promise<CreditBalance | null> {
  const db = await getDb()
  const user = await db.collection<User>("users").findOne({ email })
  if (!user) return null

  const now = new Date()
  const reset = user.aiCreditsResetAt ? new Date(user.aiCreditsResetAt) : null
  let monthly = user.aiCreditsMonthly ?? 0
  let resetAt = reset
  if (!reset || reset.getTime() <= now.getTime()) {
    const tier = resolveTier(user)
    const plan = PLAN_BY_TIER[tier]
    monthly = plan.monthlyAiCredits
    resetAt = new Date(now)
    resetAt.setMonth(resetAt.getMonth() + 1)
    await db.collection<User>("users").updateOne(
      { email },
      {
        $set: {
          aiCreditsMonthly: monthly,
          aiCreditsResetAt: resetAt,
          updatedAt: now,
        },
      },
    )
    await db.collection<AICreditTransaction>("ai_credit_transactions").insertOne({
      email,
      feature: "monthly_reset",
      cost: 0,
      bucket: "monthly",
      balanceBefore: {
        monthly: user.aiCreditsMonthly ?? 0,
        purchased: user.aiCreditsPurchased ?? 0,
      },
      balanceAfter: {
        monthly,
        purchased: user.aiCreditsPurchased ?? 0,
      },
      status: "granted",
      createdAt: now,
    })
  }

  const purchased = user.aiCreditsPurchased ?? 0
  return {
    monthly,
    purchased,
    total: monthly + purchased,
    resetAt,
  }
}

/**
 * Atomically debit credits. Tries the monthly bucket first, then purchased.
 * Mixed-bucket debits split the cost. The operation is conditional on the
 * combined balance being >= cost so concurrent debits cannot oversubscribe.
 */
export async function debit(email: string, input: DebitInput): Promise<DebitResult> {
  if (input.cost <= 0) {
    return { ok: false, reason: "insufficient" }
  }

  const db = await getDb()

  // Idempotency check.
  if (input.idempotencyKey) {
    const existing = await db
      .collection<AICreditTransaction>("ai_credit_transactions")
      .findOne({ idempotencyKey: input.idempotencyKey })
    if (existing) {
      return {
        ok: false,
        reason: "duplicate",
        existingTransactionId: existing._id?.toString(),
      }
    }
  }

  await getBalance(email) // ensures monthly bucket reset is up to date

  const user = await db.collection<User>("users").findOne({ email })
  if (!user) return { ok: false, reason: "no_user" }

  const monthly = user.aiCreditsMonthly ?? 0
  const purchased = user.aiCreditsPurchased ?? 0
  if (monthly + purchased < input.cost) {
    return {
      ok: false,
      reason: "insufficient",
      available: { monthly, purchased },
    }
  }

  const useMonthly = Math.min(monthly, input.cost)
  const usePurchased = input.cost - useMonthly
  const bucket: AICreditBucket | "mixed" =
    useMonthly > 0 && usePurchased > 0 ? "mixed" : useMonthly > 0 ? "monthly" : "purchased"

  // Conditional update guarding against race.
  const result = await db.collection<User>("users").findOneAndUpdate(
    {
      email,
      aiCreditsMonthly: { $gte: useMonthly },
      aiCreditsPurchased: { $gte: usePurchased },
    },
    {
      $inc: {
        aiCreditsMonthly: -useMonthly,
        aiCreditsPurchased: -usePurchased,
      },
      $set: { updatedAt: new Date() },
    },
    { returnDocument: "after" },
  )

  if (!result) {
    return {
      ok: false,
      reason: "insufficient",
      available: { monthly, purchased },
    }
  }

  const txn: Omit<AICreditTransaction, "_id"> = {
    email,
    feature: input.feature,
    cost: input.cost,
    bucket,
    balanceBefore: { monthly, purchased },
    balanceAfter: {
      monthly: result.aiCreditsMonthly ?? 0,
      purchased: result.aiCreditsPurchased ?? 0,
    },
    status: "debited",
    idempotencyKey: input.idempotencyKey,
    metadata: input.metadata,
    createdAt: new Date(),
  }
  let insertedId: ObjectId
  try {
    const inserted = await db
      .collection<AICreditTransaction>("ai_credit_transactions")
      .insertOne(txn as AICreditTransaction)
    insertedId = inserted.insertedId
  } catch (err: unknown) {
    // Duplicate idempotency key: another concurrent caller already recorded
    // this debit. Roll our own debit back and surface duplicate.
    const code = (err as { code?: number })?.code
    if (code === 11000) {
      await db.collection<User>("users").updateOne(
        { email },
        {
          $inc: {
            aiCreditsMonthly: useMonthly,
            aiCreditsPurchased: usePurchased,
          },
        },
      )
      const existing = await db
        .collection<AICreditTransaction>("ai_credit_transactions")
        .findOne({ idempotencyKey: input.idempotencyKey })
      return {
        ok: false,
        reason: "duplicate",
        existingTransactionId: existing?._id?.toString(),
      }
    }
    throw err
  }

  return {
    ok: true,
    transactionId: insertedId.toString(),
    bucket,
    balanceBefore: txn.balanceBefore,
    balanceAfter: txn.balanceAfter,
  }
}

export async function refund(transactionId: string, reason: string): Promise<boolean> {
  if (!ObjectId.isValid(transactionId)) return false
  const db = await getDb()
  const _id = new ObjectId(transactionId)
  const txn = await db
    .collection<AICreditTransaction>("ai_credit_transactions")
    .findOneAndUpdate(
      { _id, status: "debited" },
      { $set: { status: "refunded", refundedAt: new Date(), refundReason: reason } },
      { returnDocument: "after" },
    )
  if (!txn) return false

  // Refund into the same buckets it came out of.
  const monthlyDelta = txn.balanceBefore.monthly - txn.balanceAfter.monthly
  const purchasedDelta = txn.balanceBefore.purchased - txn.balanceAfter.purchased

  await db.collection<User>("users").updateOne(
    { email: txn.email },
    {
      $inc: {
        aiCreditsMonthly: monthlyDelta,
        aiCreditsPurchased: purchasedDelta,
      },
      $set: { updatedAt: new Date() },
    },
  )
  return true
}

/**
 * Grant credits (admin or post-checkout). bucket defaults to "purchased".
 */
export async function grant(
  email: string,
  params: { amount: number; source: AICreditFeature; bucket?: AICreditBucket; metadata?: Record<string, unknown> },
): Promise<{ balance: CreditBalance | null; transactionId: string }> {
  const db = await getDb()
  const bucket = params.bucket ?? "purchased"
  const incField =
    bucket === "monthly" ? "aiCreditsMonthly" : "aiCreditsPurchased"

  const before = await db.collection<User>("users").findOne({ email })
  if (!before) {
    return { balance: null, transactionId: "" }
  }

  const updated = await db.collection<User>("users").findOneAndUpdate(
    { email },
    {
      $inc: { [incField]: params.amount },
      $set: { updatedAt: new Date() },
    },
    { returnDocument: "after" },
  )

  const txn: Omit<AICreditTransaction, "_id"> = {
    email,
    feature: params.source,
    cost: -params.amount,
    bucket,
    balanceBefore: {
      monthly: before.aiCreditsMonthly ?? 0,
      purchased: before.aiCreditsPurchased ?? 0,
    },
    balanceAfter: {
      monthly: updated?.aiCreditsMonthly ?? 0,
      purchased: updated?.aiCreditsPurchased ?? 0,
    },
    status: "granted",
    metadata: params.metadata,
    createdAt: new Date(),
  }
  const inserted = await db
    .collection<AICreditTransaction>("ai_credit_transactions")
    .insertOne(txn as AICreditTransaction)

  return {
    balance: {
      monthly: updated?.aiCreditsMonthly ?? 0,
      purchased: updated?.aiCreditsPurchased ?? 0,
      total: (updated?.aiCreditsMonthly ?? 0) + (updated?.aiCreditsPurchased ?? 0),
      resetAt: updated?.aiCreditsResetAt ?? null,
    },
    transactionId: inserted.insertedId.toString(),
  }
}

export async function listTransactions(
  email: string,
  limit = 30,
): Promise<AICreditTransaction[]> {
  const db = await getDb()
  return db
    .collection<AICreditTransaction>("ai_credit_transactions")
    .find({ email })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray()
}
