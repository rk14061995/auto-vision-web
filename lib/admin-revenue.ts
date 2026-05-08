import "server-only"

import { ObjectId } from "mongodb"

import {
  getDb,
  type PurchaseOrder,
  type PurchaseOrderKind,
  type ReferralPayout,
  type ReferralPayoutMethod,
  type ReferralReward,
  type User,
} from "./db"

export interface RevenuePerUserRow {
  email: string
  name?: string | null
  planTier?: string | null
  ordersTotal: number
  ordersPaid: number
  revenueINR: number
  revenueUSD: number
  subscriptionINR: number
  subscriptionUSD: number
  creditPackINR: number
  creditPackUSD: number
  adINR: number
  adUSD: number
  marketplaceINR: number
  marketplaceUSD: number
  firstPaidAt?: Date | null
  lastPaidAt?: Date | null
}

export interface RevenuePerUserPage {
  rows: RevenuePerUserRow[]
  totalUsers: number
  totals: {
    revenueINR: number
    revenueUSD: number
    paidOrders: number
  }
}

/**
 * Aggregate paid revenue per buyer email across all purchase orders.
 *
 * The aggregation runs over `purchase_orders` (not the `users` collection),
 * so anonymous-by-email but non-registered customers still appear.
 */
export async function getRevenuePerUser(opts?: {
  search?: string
  skip?: number
  limit?: number
  sortBy?: "revenueINR" | "revenueUSD" | "ordersPaid" | "lastPaidAt"
}): Promise<RevenuePerUserPage> {
  const db = await getDb()
  const search = opts?.search?.trim().toLowerCase()
  const skip = opts?.skip ?? 0
  const limit = Math.min(opts?.limit ?? 50, 200)
  const sortBy = opts?.sortBy ?? "revenueINR"

  const matchPaid: Record<string, unknown> = { status: "paid" }
  if (search) {
    matchPaid.email = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" }
  }

  const sumIfKindCurrency = (kind: PurchaseOrderKind, currency: "INR" | "USD") => ({
    $sum: {
      $cond: [
        {
          $and: [
            { $eq: ["$currency", currency] },
            {
              $eq: [
                { $ifNull: ["$kind", "subscription"] },
                kind,
              ],
            },
          ],
        },
        "$finalAmount",
        0,
      ],
    },
  })

  const sumIfCurrency = (currency: "INR" | "USD") => ({
    $sum: {
      $cond: [{ $eq: ["$currency", currency] }, "$finalAmount", 0],
    },
  })

  const pipeline: Record<string, unknown>[] = [
    { $match: matchPaid },
    {
      $group: {
        _id: "$email",
        ordersPaid: { $sum: 1 },
        revenueINR: sumIfCurrency("INR"),
        revenueUSD: sumIfCurrency("USD"),
        subscriptionINR: sumIfKindCurrency("subscription", "INR"),
        subscriptionUSD: sumIfKindCurrency("subscription", "USD"),
        creditPackINR: sumIfKindCurrency("credit_pack", "INR"),
        creditPackUSD: sumIfKindCurrency("credit_pack", "USD"),
        adINR: sumIfKindCurrency("ad", "INR"),
        adUSD: sumIfKindCurrency("ad", "USD"),
        marketplaceINR: sumIfKindCurrency("marketplace", "INR"),
        marketplaceUSD: sumIfKindCurrency("marketplace", "USD"),
        firstPaidAt: { $min: "$createdAt" },
        lastPaidAt: { $max: "$createdAt" },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "email",
        as: "user",
      },
    },
    {
      $project: {
        _id: 0,
        email: "$_id",
        name: { $ifNull: [{ $arrayElemAt: ["$user.name", 0] }, null] },
        planTier: { $ifNull: [{ $arrayElemAt: ["$user.planTier", 0] }, null] },
        ordersPaid: 1,
        revenueINR: 1,
        revenueUSD: 1,
        subscriptionINR: 1,
        subscriptionUSD: 1,
        creditPackINR: 1,
        creditPackUSD: 1,
        adINR: 1,
        adUSD: 1,
        marketplaceINR: 1,
        marketplaceUSD: 1,
        firstPaidAt: 1,
        lastPaidAt: 1,
      },
    },
  ]

  const sortStage: Record<string, 1 | -1> = {}
  sortStage[sortBy] = -1
  pipeline.push({ $sort: sortStage }, { $skip: skip }, { $limit: limit })

  const rows = (await db
    .collection<PurchaseOrder>("purchase_orders")
    .aggregate(pipeline)
    .toArray()) as RevenuePerUserRow[]

  // Total ordersTotal (created + paid) per row, computed in a second pass to keep pipeline fast.
  const emails = rows.map((r) => r.email)
  let totalsByEmail: Map<string, number> = new Map()
  if (emails.length > 0) {
    const allRows = await db
      .collection<PurchaseOrder>("purchase_orders")
      .aggregate([
        { $match: { email: { $in: emails } } },
        { $group: { _id: "$email", ordersTotal: { $sum: 1 } } },
      ])
      .toArray()
    totalsByEmail = new Map(allRows.map((r) => [r._id as string, (r as { ordersTotal: number }).ordersTotal]))
  }
  rows.forEach((r) => {
    r.ordersTotal = totalsByEmail.get(r.email) ?? r.ordersPaid
  })

  // Aggregate global totals across all paid orders (for header strip).
  const totalsAgg = await db
    .collection<PurchaseOrder>("purchase_orders")
    .aggregate([
      { $match: { status: "paid" } },
      {
        $group: {
          _id: null,
          revenueINR: sumIfCurrency("INR"),
          revenueUSD: sumIfCurrency("USD"),
          paidOrders: { $sum: 1 },
        },
      },
    ])
    .next()

  // Distinct buyers with paid orders (used as totalUsers for pagination context).
  const distinctEmails = await db
    .collection<PurchaseOrder>("purchase_orders")
    .distinct("email", { status: "paid" })

  return {
    rows,
    totalUsers: distinctEmails.length,
    totals: {
      revenueINR: (totalsAgg?.revenueINR as number) ?? 0,
      revenueUSD: (totalsAgg?.revenueUSD as number) ?? 0,
      paidOrders: (totalsAgg?.paidOrders as number) ?? 0,
    },
  }
}

export interface UserRevenueDetail {
  user: Omit<User, "password"> | null
  totals: {
    revenueINR: number
    revenueUSD: number
    ordersPaid: number
    ordersTotal: number
    byKind: Record<PurchaseOrderKind, { INR: number; USD: number; count: number }>
  }
  orders: PurchaseOrder[]
}

export async function getUserRevenueDetail(email: string): Promise<UserRevenueDetail> {
  const db = await getDb()
  const [user, orders] = await Promise.all([
    db.collection<User>("users").findOne(
      { email },
      { projection: { password: 0 } },
    ) as Promise<Omit<User, "password"> | null>,
    db
      .collection<PurchaseOrder>("purchase_orders")
      .find({ email })
      .sort({ createdAt: -1 })
      .toArray(),
  ])

  const byKind: UserRevenueDetail["totals"]["byKind"] = {
    subscription: { INR: 0, USD: 0, count: 0 },
    credit_pack: { INR: 0, USD: 0, count: 0 },
    ad: { INR: 0, USD: 0, count: 0 },
    marketplace: { INR: 0, USD: 0, count: 0 },
  }
  let revenueINR = 0
  let revenueUSD = 0
  let ordersPaid = 0
  for (const o of orders) {
    if (o.status !== "paid") continue
    ordersPaid += 1
    const kind = (o.kind ?? "subscription") as PurchaseOrderKind
    if (o.currency === "INR") {
      revenueINR += o.finalAmount
      byKind[kind].INR += o.finalAmount
    } else {
      revenueUSD += o.finalAmount
      byKind[kind].USD += o.finalAmount
    }
    byKind[kind].count += 1
  }

  return {
    user,
    totals: {
      revenueINR,
      revenueUSD,
      ordersPaid,
      ordersTotal: orders.length,
      byKind,
    },
    orders,
  }
}

export interface ReferrerEarningsRow {
  email: string
  name?: string | null
  referralCode: string | null
  referredCount: number
  rewardCountINR: number
  rewardCountUSD: number
  earnedINR: number
  earnedUSD: number
  paidOutINR: number
  paidOutUSD: number
  pendingINR: number
  pendingUSD: number
  lastRewardAt?: Date | null
}

/**
 * Admin-side referral leaderboard with monetary breakdown.
 *
 * - `referredCount` = users who signed up with this referrer's code.
 * - `earnedINR/USD`  = total reward amounts logged in `referral_rewards`.
 * - `paidOutINR/USD` = total paid out via `referral_payouts`.
 * - `pendingINR/USD` = earned − paid out (clamped to >= 0).
 */
export async function getReferrerLeaderboard(opts?: {
  search?: string
  limit?: number
  skip?: number
}): Promise<ReferrerEarningsRow[]> {
  const db = await getDb()
  const limit = Math.min(opts?.limit ?? 50, 200)
  const skip = opts?.skip ?? 0
  const search = opts?.search?.trim().toLowerCase()

  const userMatch: Record<string, unknown> = {
    referralCode: { $exists: true, $ne: null },
  }
  if (search) {
    const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    userMatch.$or = [
      { email: { $regex: safe, $options: "i" } },
      { name: { $regex: safe, $options: "i" } },
    ]
  }

  const rows = await db
    .collection<User>("users")
    .aggregate([
      { $match: userMatch },
      {
        $lookup: {
          from: "users",
          localField: "referralCode",
          foreignField: "referredByCode",
          as: "_referred",
        },
      },
      {
        $lookup: {
          from: "referral_rewards",
          localField: "email",
          foreignField: "referrerEmail",
          as: "_rewards",
        },
      },
      {
        $lookup: {
          from: "referral_payouts",
          localField: "email",
          foreignField: "referrerEmail",
          as: "_payouts",
        },
      },
      {
        $project: {
          _id: 0,
          email: 1,
          name: 1,
          referralCode: 1,
          referredCount: { $size: "$_referred" },
          earnedINR: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$_rewards",
                    as: "r",
                    cond: { $eq: ["$$r.currency", "INR"] },
                  },
                },
                as: "r",
                in: "$$r.rewardAmount",
              },
            },
          },
          earnedUSD: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$_rewards",
                    as: "r",
                    cond: { $eq: ["$$r.currency", "USD"] },
                  },
                },
                as: "r",
                in: "$$r.rewardAmount",
              },
            },
          },
          rewardCountINR: {
            $size: {
              $filter: {
                input: "$_rewards",
                as: "r",
                cond: { $eq: ["$$r.currency", "INR"] },
              },
            },
          },
          rewardCountUSD: {
            $size: {
              $filter: {
                input: "$_rewards",
                as: "r",
                cond: { $eq: ["$$r.currency", "USD"] },
              },
            },
          },
          paidOutINR: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$_payouts",
                    as: "p",
                    cond: { $eq: ["$$p.currency", "INR"] },
                  },
                },
                as: "p",
                in: "$$p.amount",
              },
            },
          },
          paidOutUSD: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$_payouts",
                    as: "p",
                    cond: { $eq: ["$$p.currency", "USD"] },
                  },
                },
                as: "p",
                in: "$$p.amount",
              },
            },
          },
          lastRewardAt: { $max: "$_rewards.createdAt" },
        },
      },
      // Surface referrers that have any signal (referred users OR earned rewards).
      {
        $match: {
          $or: [
            { referredCount: { $gt: 0 } },
            { earnedINR: { $gt: 0 } },
            { earnedUSD: { $gt: 0 } },
          ],
        },
      },
      { $sort: { earnedINR: -1, earnedUSD: -1, referredCount: -1 } },
      { $skip: skip },
      { $limit: limit },
    ])
    .toArray()

  return rows.map((r) => {
    const earnedINR = (r.earnedINR as number) ?? 0
    const earnedUSD = (r.earnedUSD as number) ?? 0
    const paidOutINR = (r.paidOutINR as number) ?? 0
    const paidOutUSD = (r.paidOutUSD as number) ?? 0
    return {
      email: r.email as string,
      name: (r.name as string | null) ?? null,
      referralCode: (r.referralCode as string | null) ?? null,
      referredCount: (r.referredCount as number) ?? 0,
      rewardCountINR: (r.rewardCountINR as number) ?? 0,
      rewardCountUSD: (r.rewardCountUSD as number) ?? 0,
      earnedINR,
      earnedUSD,
      paidOutINR,
      paidOutUSD,
      pendingINR: Math.max(earnedINR - paidOutINR, 0),
      pendingUSD: Math.max(earnedUSD - paidOutUSD, 0),
      lastRewardAt: (r.lastRewardAt as Date | null) ?? null,
    } as ReferrerEarningsRow
  })
}

export interface ReferrerDetail {
  user: Omit<User, "password"> | null
  totals: ReferrerEarningsRow
  rewards: ReferralReward[]
  payouts: ReferralPayout[]
  referredUsers: Array<{
    email: string
    name?: string | null
    createdAt: Date
    planTier?: string | null
  }>
}

export async function getReferrerDetail(email: string): Promise<ReferrerDetail> {
  const db = await getDb()
  const [user, rewards, payouts, referredUsers] = await Promise.all([
    db.collection<User>("users").findOne(
      { email },
      { projection: { password: 0 } },
    ) as Promise<Omit<User, "password"> | null>,
    db
      .collection<ReferralReward>("referral_rewards")
      .find({ referrerEmail: email })
      .sort({ createdAt: -1 })
      .toArray(),
    db
      .collection<ReferralPayout>("referral_payouts")
      .find({ referrerEmail: email })
      .sort({ paidAt: -1 })
      .toArray(),
    (async () => {
      if (!email) return []
      const owner = await db
        .collection<User>("users")
        .findOne({ email }, { projection: { referralCode: 1 } })
      if (!owner?.referralCode) return []
      return db
        .collection<User>("users")
        .find(
          { referredByCode: owner.referralCode },
          { projection: { email: 1, name: 1, createdAt: 1, planTier: 1 } },
        )
        .sort({ createdAt: -1 })
        .toArray()
    })(),
  ])

  let earnedINR = 0
  let earnedUSD = 0
  let rewardCountINR = 0
  let rewardCountUSD = 0
  for (const r of rewards) {
    if (r.currency === "INR") {
      earnedINR += r.rewardAmount
      rewardCountINR += 1
    } else {
      earnedUSD += r.rewardAmount
      rewardCountUSD += 1
    }
  }
  let paidOutINR = 0
  let paidOutUSD = 0
  for (const p of payouts) {
    if (p.currency === "INR") paidOutINR += p.amount
    else paidOutUSD += p.amount
  }

  const referralCode = user?.referralCode ?? null

  return {
    user,
    totals: {
      email,
      name: user?.name ?? null,
      referralCode,
      referredCount: referredUsers.length,
      rewardCountINR,
      rewardCountUSD,
      earnedINR,
      earnedUSD,
      paidOutINR,
      paidOutUSD,
      pendingINR: Math.max(earnedINR - paidOutINR, 0),
      pendingUSD: Math.max(earnedUSD - paidOutUSD, 0),
      lastRewardAt: rewards[0]?.createdAt ?? null,
    },
    rewards,
    payouts,
    referredUsers: referredUsers.map((u) => ({
      email: u.email,
      name: u.name ?? null,
      createdAt: u.createdAt,
      planTier: u.planTier ?? null,
    })),
  }
}

/**
 * Record a manual payout to a referrer. The amount is informational and is
 * stored verbatim; the caller decides which (if any) reward documents are
 * "covered" by this payout via `rewardIdsCovered` (those rows get marked
 * `paidOutAt`/`payoutId`). The pending balance shown to the admin is purely
 * derived from `earned − paidOut` in the leaderboard aggregation.
 */
export async function recordReferralPayout(args: {
  referrerEmail: string
  amount: number
  currency: "INR" | "USD"
  method: ReferralPayoutMethod
  reference?: string
  notes?: string
  /** Optional list of `referral_rewards._id` that this payout settles. */
  rewardIdsCovered?: string[]
  paidBy: string
}): Promise<ReferralPayout> {
  if (!args.referrerEmail) throw new Error("referrerEmail required")
  if (!Number.isFinite(args.amount) || args.amount <= 0) throw new Error("amount must be > 0")
  if (args.currency !== "INR" && args.currency !== "USD") throw new Error("invalid currency")

  const db = await getDb()
  const now = new Date()
  const rewardObjectIds = (args.rewardIdsCovered ?? [])
    .map((id) => {
      try {
        return new ObjectId(id)
      } catch {
        return null
      }
    })
    .filter((x): x is ObjectId => x !== null)

  const payoutDoc: ReferralPayout = {
    referrerEmail: args.referrerEmail,
    amount: args.amount,
    currency: args.currency,
    method: args.method,
    reference: args.reference,
    notes: args.notes,
    rewardIdsCovered: rewardObjectIds,
    paidBy: args.paidBy,
    paidAt: now,
    createdAt: now,
  }

  const ins = await db.collection<ReferralPayout>("referral_payouts").insertOne(payoutDoc)
  const payoutId = ins.insertedId

  if (rewardObjectIds.length > 0) {
    await db
      .collection<ReferralReward>("referral_rewards")
      .updateMany(
        { _id: { $in: rewardObjectIds }, referrerEmail: args.referrerEmail },
        { $set: { paidOutAt: now, payoutId } },
      )
  }

  return { ...payoutDoc, _id: payoutId }
}
