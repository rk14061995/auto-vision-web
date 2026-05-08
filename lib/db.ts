import "server-only"
import { MongoClient, Db, ObjectId } from "mongodb"
import { getPlanById } from "./products"

const uri = process.env.MONGODB_URI || ""
const options = {}

let client: MongoClient | null = null
let clientPromise: Promise<MongoClient> | null = null
let indexesEnsured = false

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined
  // eslint-disable-next-line no-var
  var _avIndexesEnsured: boolean | undefined
}

function getClientPromise(): Promise<MongoClient> {
  if (!uri) {
    throw new Error("Please add your MongoDB URI to environment variables (Settings > Vars)")
  }
  
  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options)
      global._mongoClientPromise = client.connect()
    }
    return global._mongoClientPromise
  } else {
    if (!clientPromise) {
      client = new MongoClient(uri, options)
      clientPromise = client.connect()
    }
    return clientPromise
  }
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise()
  const db = client.db("saas-platform")

  if (!indexesEnsured && !global._avIndexesEnsured) {
    indexesEnsured = true
    global._avIndexesEnsured = true
    ensureIndexes(db).catch((err) => {
      indexesEnsured = false
      global._avIndexesEnsured = false
      console.error("[db] ensureIndexes failed:", err)
    })
  }

  return db
}

async function ensureIndexes(db: Db): Promise<void> {
  await Promise.all([
    db.collection("users").createIndexes([
      { key: { email: 1 }, unique: true, name: "users_email_unique" },
      { key: { referralCode: 1 }, sparse: true, name: "users_referralCode" },
      { key: { teamId: 1 }, sparse: true, name: "users_teamId" },
    ]),
    db.collection("purchase_orders").createIndexes([
      { key: { orderId: 1 }, unique: true, name: "orders_orderId_unique" },
      { key: { email: 1, createdAt: -1 }, name: "orders_email_created" },
      { key: { status: 1, createdAt: -1 }, name: "orders_status_created" },
    ]),
    db.collection("coupons").createIndexes([
      { key: { code: 1 }, unique: true, name: "coupons_code_unique" },
    ]),
    db.collection("coupon_redemptions").createIndexes([
      { key: { code: 1, email: 1 }, name: "coupon_red_code_email" },
    ]),
    db.collection("car_projects").createIndexes([
      { key: { email: 1, lastAccessedAt: -1 }, name: "projects_email_accessed" },
      { key: { teamId: 1 }, sparse: true, name: "projects_teamId" },
    ]),
    db.collection("advertisements").createIndexes([
      { key: { email: 1, createdAt: -1 }, name: "ads_email_created" },
      { key: { status: 1, endDate: 1 }, name: "ads_status_end" },
    ]),
    db.collection("ai_credit_transactions").createIndexes([
      { key: { email: 1, createdAt: -1 }, name: "aict_email_created" },
      { key: { idempotencyKey: 1 }, unique: true, sparse: true, name: "aict_idempotency_unique" },
    ]),
    db.collection("usage_events").createIndexes([
      { key: { email: 1, createdAt: -1 }, name: "usage_email_created" },
      { key: { type: 1, createdAt: -1 }, name: "usage_type_created" },
    ]),
    db.collection("webhook_events").createIndexes([
      { key: { provider: 1, eventId: 1 }, unique: true, name: "webhook_unique" },
    ]),
    db.collection("teams").createIndexes([
      { key: { ownerEmail: 1 }, name: "teams_owner" },
    ]),
    db.collection("team_members").createIndexes([
      { key: { teamId: 1, email: 1 }, unique: true, name: "tm_team_email_unique" },
      { key: { email: 1 }, name: "tm_email" },
    ]),
    db.collection("team_invites").createIndexes([
      { key: { token: 1 }, unique: true, name: "ti_token_unique" },
      { key: { teamId: 1 }, name: "ti_team" },
    ]),
    db.collection("marketplace_assets").createIndexes([
      { key: { creatorEmail: 1, createdAt: -1 }, name: "mp_creator" },
      { key: { status: 1, type: 1 }, name: "mp_status_type" },
    ]),
    db.collection("marketplace_purchases").createIndexes([
      { key: { buyerEmail: 1, createdAt: -1 }, name: "mpp_buyer" },
      { key: { assetId: 1 }, name: "mpp_asset" },
    ]),
    db.collection("referral_milestones").createIndexes([
      { key: { email: 1, milestoneId: 1 }, unique: true, name: "rm_email_milestone_unique" },
    ]),
    db.collection("referral_rewards").createIndexes([
      { key: { referrerEmail: 1, createdAt: -1 }, name: "rr_referrer_created" },
      { key: { paidOutAt: 1 }, sparse: true, name: "rr_paid_out" },
    ]),
    db.collection("referral_payouts").createIndexes([
      { key: { referrerEmail: 1, paidAt: -1 }, name: "rp_referrer_paid" },
    ]),
    db.collection("template_drops").createIndexes([
      { key: { publishedAt: -1 }, name: "td_published" },
      { key: { isActive: 1 }, name: "td_active" },
    ]),
  ])
}

// Check if MongoDB is configured
export function isDbConfigured(): boolean {
  return !!process.env.MONGODB_URI
}

// Plan tier identifiers used by the new monetization system. Legacy planType
// strings (1-project, 5-projects, 50-projects, 100-projects, business) are
// migrated to these via lib/migrate-plans.ts but remain valid until migration
// completes.
export type PlanTier = "free" | "creator" | "pro" | "studio" | "enterprise"
export type LegacyPlanId =
  | "free"
  | "1-project"
  | "5-projects"
  | "50-projects"
  | "100-projects"
  | "business"
  | "creator"
  | "pro"
  | "studio"
  | "enterprise"
export type BillingCycle = "monthly" | "annual"
export type TeamRole = "owner" | "admin" | "member"

export interface UserUsageMetrics {
  projectsCreated: number
  exports: number
  aiCalls: number
  sharesLastMonth: number
}

// User types
export interface User {
  _id?: ObjectId
  email: string
  password: string
  name: string
  country: "IN" | "US" | null
  // Legacy field retained; values may be old IDs until migration runs.
  planType: LegacyPlanId
  // New canonical tier post-migration. Optional during the transition window.
  planTier?: PlanTier
  billingCycle?: BillingCycle | null
  projectLimit: number
  projectsUsed: number
  subscriptionExpiry: Date | null
  pendingDowngradeTo?: PlanTier | null
  pendingDowngradeAt?: Date | null
  dunning?: boolean
  lemonSqueezyCustomerId: string | null
  lemonSqueezySubscriptionId: string | null
  razorpayCustomerId: string | null
  // Razorpay payment id from latest successful order. (razorpayCustomerId is
  // misnamed for legacy reasons and should be migrated to this field over time.)
  razorpayLastPaymentId?: string | null
  referralCode: string | null
  referredByCode: string | null
  creditBalanceINR: number
  creditBalanceUSD: number
  // AI credits (new monetization). monthly bucket resets per cycle, purchased
  // bucket rolls over until consumed.
  aiCreditsMonthly?: number
  aiCreditsPurchased?: number
  aiCreditsResetAt?: Date | null
  teamId?: ObjectId | null
  teamRole?: TeamRole | null
  commercialLicense?: boolean
  legacyGrandfathered?: boolean
  legacyMigratedAt?: Date | null
  usageMetrics?: UserUsageMetrics
  createdAt: Date
  updatedAt: Date
}

export type PurchaseOrderKind = "subscription" | "credit_pack" | "ad" | "marketplace"

export interface PurchaseOrder {
  _id?: ObjectId
  orderId: string
  email: string
  planId: string
  // Distinguishes subscription purchases from credit-pack / ad / marketplace.
  // Defaults to "subscription" for legacy rows that don't have it.
  kind?: PurchaseOrderKind
  // For credit_pack purchases: the pack id (e.g. "pack_500") and credit count.
  creditPackId?: string
  creditAmount?: number
  // For subscription purchases: monthly vs annual.
  billingCycle?: BillingCycle
  provider: "razorpay" | "lemonsqueezy"
  amount: number
  currency: "INR" | "USD"
  status: "created" | "paid" | "failed"
  paymentId: string | null
  couponCode: string | null
  couponDiscount: number
  referralDiscount: number
  creditDiscount: number
  finalAmount: number
  appliedReferralCode: string | null
  referrerEmail: string | null
  createdAt: Date
  updatedAt: Date
}

export type CouponDiscountType = "percent" | "flat"

export interface Coupon {
  _id?: ObjectId
  code: string
  isActive: boolean
  discountType: CouponDiscountType
  discountValue: number
  currency: "INR" | "USD" | "ANY"
  minAmount?: number
  maxUses?: number
  perUserLimit?: number
  startsAt?: Date
  expiresAt?: Date
  usedCount: number
  createdAt: Date
  updatedAt: Date
}

export interface CouponRedemption {
  _id?: ObjectId
  code: string
  email: string
  orderId: string
  amountDiscounted: number
  currency: "INR" | "USD"
  createdAt: Date
}

export interface CreditTransaction {
  _id?: ObjectId
  email: string
  amount: number
  currency: "INR" | "USD"
  type: "referral_reward" | "credit_spent"
  referenceOrderId?: string
  createdAt: Date
}

export interface ReferralReward {
  _id?: ObjectId
  referrerEmail: string
  referredEmail: string
  orderId: string
  rewardAmount: number
  currency: "INR" | "USD"
  /** Set when an admin payout has covered this reward. */
  paidOutAt?: Date | null
  payoutId?: ObjectId | null
  createdAt: Date
}

export type ReferralPayoutMethod =
  | "manual"
  | "bank"
  | "upi"
  | "paypal"
  | "credit_topup"
  | "other"

export interface ReferralPayout {
  _id?: ObjectId
  referrerEmail: string
  amount: number
  currency: "INR" | "USD"
  method: ReferralPayoutMethod
  reference?: string
  notes?: string
  /** Reward documents this payout covered (for audit trail). */
  rewardIdsCovered: ObjectId[]
  paidBy: string
  paidAt: Date
  createdAt: Date
}

export interface Advertisement {
  _id?: ObjectId
  email: string
  shopName: string
  shopDescription: string
  contactInfo: string
  images: string[] // URLs of uploaded images
  adType: "banner" | "horizontal" | "square" | "video"
  status: "active" | "expired" | "pending"
  views: number
  clicks: number
  startDate: Date
  endDate: Date
  paymentAmount: number
  paymentCurrency: "INR" | "USD"
  paymentId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CarProject {
  _id?: ObjectId
  email: string
  // Optional ownership by team (for studio/enterprise plans).
  teamId?: ObjectId | null
  projectName: string
  description: string
  carDetails: {
    make: string // e.g., "Tesla", "BMW"
    model: string // e.g., "Model S", "M4"
    year: number
    color: string
  }
  baseImage: string // URL of the base car image
  modifications: any[] // Fabric.js canvas objects
  canvasData: string // Serialized canvas state (JSON)
  status: "draft" | "completed"
  createdAt: Date
  updatedAt: Date
  lastAccessedAt: Date
}

// ─── AI Credit Ledger ────────────────────────────────────────────────────────

export type AICreditFeature =
  | "ai_wrap_generate"
  | "ai_background_remove"
  | "ai_color_variants"
  | "ai_wheel_suggest"
  | "ai_enhance"
  | "admin_grant"
  | "credit_pack"
  | "monthly_reset"
  | "signup_bonus"

export type AICreditBucket = "monthly" | "purchased"

export interface AICreditTransaction {
  _id?: ObjectId
  email: string
  feature: AICreditFeature
  cost: number // positive for debit, negative for credit/grant
  bucket: AICreditBucket | "mixed"
  balanceBefore: { monthly: number; purchased: number }
  balanceAfter: { monthly: number; purchased: number }
  status: "debited" | "refunded" | "granted"
  idempotencyKey?: string
  providerRequestId?: string
  refundedAt?: Date
  refundReason?: string
  metadata?: Record<string, unknown>
  createdAt: Date
}

// ─── Usage Events (analytics + retention) ────────────────────────────────────

export type UsageEventType =
  | "project_created"
  | "project_opened"
  | "project_exported"
  | "project_shared"
  | "ai_call"
  | "ai_call_refunded"
  | "upgrade_modal_shown"
  | "upgrade_modal_clicked"
  | "checkout_started"
  | "checkout_abandoned"
  | "checkout_completed"
  | "referral_converted"
  | "asset_used"
  | "marketplace_asset_view"
  | "team_invite_sent"
  | "team_member_joined"
  | "credit_pack_purchased"

export interface UsageEvent {
  _id?: ObjectId
  email: string
  type: UsageEventType
  metadata?: Record<string, unknown>
  createdAt: Date
}

// ─── Webhook Idempotency ─────────────────────────────────────────────────────

export interface WebhookEvent {
  _id?: ObjectId
  provider: "razorpay" | "lemonsqueezy"
  eventId: string
  eventName?: string
  processedAt: Date
}

// ─── Teams ───────────────────────────────────────────────────────────────────

export interface TeamBrandKit {
  logoUrl?: string
  primaryColor?: string
  secondaryColor?: string
  fontFamily?: string
}

export interface Team {
  _id?: ObjectId
  ownerEmail: string
  name: string
  brandKit?: TeamBrandKit
  seatsAllowed: number
  createdAt: Date
  updatedAt: Date
}

export interface TeamMember {
  _id?: ObjectId
  teamId: ObjectId
  email: string
  role: TeamRole
  invitedBy: string
  joinedAt: Date
}

export interface TeamInvite {
  _id?: ObjectId
  teamId: ObjectId
  email: string
  token: string
  role: TeamRole
  invitedBy: string
  expiresAt: Date
  status: "pending" | "accepted" | "revoked" | "expired"
  createdAt: Date
}

// ─── Marketplace Foundation ──────────────────────────────────────────────────

export type MarketplaceAssetType =
  | "wrap"
  | "decal"
  | "template"
  | "wheel_preset"
  | "body_kit"

export type MarketplaceAssetStatus = "pending" | "approved" | "rejected" | "archived"

export interface MarketplaceAsset {
  _id?: ObjectId
  creatorEmail: string
  type: MarketplaceAssetType
  title: string
  description: string
  thumbnailUrl: string
  assetUrl: string
  premium: boolean
  priceIN: number
  priceUS: number
  commissionPct: number // platform cut, default 25
  downloads: number
  revenueIN: number
  revenueUS: number
  rating: number
  ratingCount: number
  status: MarketplaceAssetStatus
  rejectionReason?: string
  tags?: string[]
  createdAt: Date
  updatedAt: Date
}

export interface MarketplacePurchase {
  _id?: ObjectId
  buyerEmail: string
  assetId: ObjectId
  amount: number
  currency: "INR" | "USD"
  orderId: string
  createdAt: Date
}

// ─── Referral Milestones ─────────────────────────────────────────────────────

export interface ReferralMilestone {
  _id?: ObjectId
  email: string
  milestoneId: "ref_3" | "ref_10" | "ref_25"
  bonusCredits: number
  achievedAt: Date
}

// ─── Template Drops (retention) ──────────────────────────────────────────────

export interface TemplateDrop {
  _id?: ObjectId
  title: string
  description: string
  thumbnailUrl: string
  assetUrl: string
  tags: string[]
  isActive: boolean
  publishedAt: Date
  createdAt: Date
  updatedAt: Date
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const db = await getDb()
  return db.collection<User>("users").findOne({ email })
}

export async function getUserById(userId: string): Promise<User | null> {
  if (!ObjectId.isValid(userId)) return null
  const db = await getDb()
  return db.collection<User>("users").findOne({ _id: new ObjectId(userId) })
}

export async function createUser(userData: Omit<User, "_id">): Promise<User> {
  const db = await getDb()
  const result = await db.collection<User>("users").insertOne(userData as User)
  return { ...userData, _id: result.insertedId }
}

export async function updateUser(
  email: string,
  update: Partial<User>
): Promise<User | null> {
  const db = await getDb()
  const result = await db
    .collection<User>("users")
    .findOneAndUpdate(
      { email },
      { $set: { ...update, updatedAt: new Date() } },
      { returnDocument: "after" }
    )
  return result
}

export async function createPurchaseOrder(
  order: Omit<PurchaseOrder, "_id" | "createdAt" | "updatedAt">
): Promise<PurchaseOrder> {
  const db = await getDb()
  const now = new Date()
  const document: PurchaseOrder = {
    ...order,
    createdAt: now,
    updatedAt: now,
  }

  const result = await db.collection<PurchaseOrder>("purchase_orders").insertOne(document)
  return { ...document, _id: result.insertedId }
}

export async function getPurchaseOrderByOrderId(
  orderId: string
): Promise<PurchaseOrder | null> {
  const db = await getDb()
  return db.collection<PurchaseOrder>("purchase_orders").findOne({ orderId })
}

export async function markPurchaseOrderPaid(
  orderId: string,
  paymentId: string
): Promise<void> {
  const db = await getDb()
  await db.collection<PurchaseOrder>("purchase_orders").updateOne(
    { orderId },
    {
      $set: {
        status: "paid",
        paymentId,
        updatedAt: new Date(),
      },
    }
  )
}

export async function applyPlanPurchase(
  email: string,
  planId: string,
  providerPaymentId: string,
  options?: { provider?: "razorpay" | "lemonsqueezy"; cycle?: BillingCycle }
): Promise<User | null> {
  const user = await getUserByEmail(email)
  if (!user) return null

  const { PLAN_BY_TIER, billingCycleMonths } = await import("./plans")
  const { resolveTier } = await import("./feature-flags")

  const plan = getPlanById(planId)
  if (!plan) return null

  const tier = resolveTier({ planType: plan.id })
  const tierPlan = PLAN_BY_TIER[tier]

  const cycle: BillingCycle = options?.cycle ?? "monthly"
  const now = new Date()
  const baseDate =
    user.subscriptionExpiry && user.subscriptionExpiry > now
      ? new Date(user.subscriptionExpiry)
      : now
  baseDate.setMonth(baseDate.getMonth() + billingCycleMonths(cycle))

  // Reset monthly AI bucket on plan purchase.
  const nextReset = new Date(now)
  nextReset.setMonth(nextReset.getMonth() + 1)

  const newProjectLimit =
    user.legacyGrandfathered && user.projectLimit && user.projectLimit > tierPlan.projectLimit
      ? user.projectLimit
      : tierPlan.projectLimit

  const update: Partial<User> = {
    planType: tier as LegacyPlanId,
    planTier: tier,
    billingCycle: cycle,
    projectLimit: newProjectLimit,
    projectsUsed: Math.min(user.projectsUsed, newProjectLimit === -1 ? user.projectsUsed : newProjectLimit),
    subscriptionExpiry: baseDate,
    pendingDowngradeTo: null,
    pendingDowngradeAt: null,
    dunning: false,
    aiCreditsMonthly: tierPlan.monthlyAiCredits,
    aiCreditsResetAt: nextReset,
    commercialLicense: tierPlan.features.commercialLicense,
  }

  if (options?.provider === "lemonsqueezy") {
    // lemonSqueezyCustomerId/SubscriptionId are set by the webhook handler.
  } else {
    update.razorpayLastPaymentId = providerPaymentId
    // Keep legacy field populated for backward compatibility.
    update.razorpayCustomerId = providerPaymentId
  }

  return updateUser(email, update)
}

export async function getUserByReferralCode(referralCode: string): Promise<User | null> {
  const db = await getDb()
  return db.collection<User>("users").findOne({ referralCode })
}

export async function getPaidPurchaseCountByEmail(email: string): Promise<number> {
  const db = await getDb()
  return db.collection<PurchaseOrder>("purchase_orders").countDocuments({
    email,
    status: "paid",
  })
}

export async function getCouponByCode(code: string): Promise<Coupon | null> {
  const db = await getDb()
  return db.collection<Coupon>("coupons").findOne({ code: code.toUpperCase() })
}

export async function countCouponRedemptionsByUser(code: string, email: string): Promise<number> {
  const db = await getDb()
  return db.collection<CouponRedemption>("coupon_redemptions").countDocuments({
    code: code.toUpperCase(),
    email,
  })
}

export async function validateCoupon(params: {
  code: string
  email: string
  amount: number
  currency: "INR" | "USD"
}): Promise<{ ok: true; coupon: Coupon; discount: number } | { ok: false; error: string }> {
  const coupon = await getCouponByCode(params.code)
  if (!coupon || !coupon.isActive) {
    return { ok: false, error: "Invalid coupon" }
  }

  const now = new Date()
  if (coupon.startsAt && coupon.startsAt > now) {
    return { ok: false, error: "Coupon not active yet" }
  }
  if (coupon.expiresAt && coupon.expiresAt < now) {
    return { ok: false, error: "Coupon expired" }
  }
  if (coupon.currency !== "ANY" && coupon.currency !== params.currency) {
    return { ok: false, error: "Coupon not valid for this currency" }
  }
  if (coupon.minAmount && params.amount < coupon.minAmount) {
    return { ok: false, error: "Order amount too low for this coupon" }
  }
  if (typeof coupon.maxUses === "number" && coupon.usedCount >= coupon.maxUses) {
    return { ok: false, error: "Coupon usage limit reached" }
  }

  if (typeof coupon.perUserLimit === "number") {
    const userUses = await countCouponRedemptionsByUser(coupon.code, params.email)
    if (userUses >= coupon.perUserLimit) {
      return { ok: false, error: "Coupon usage limit reached for this user" }
    }
  }

  const discountRaw =
    coupon.discountType === "percent"
      ? (params.amount * coupon.discountValue) / 100
      : coupon.discountValue

  const discount = Math.max(0, Math.min(params.amount, Number(discountRaw.toFixed(2))))

  return { ok: true, coupon, discount }
}

export async function redeemCoupon(params: {
  code: string
  email: string
  orderId: string
  amountDiscounted: number
  currency: "INR" | "USD"
}): Promise<void> {
  const db = await getDb()
  const code = params.code.toUpperCase()

  await db.collection<CouponRedemption>("coupon_redemptions").insertOne({
    code,
    email: params.email,
    orderId: params.orderId,
    amountDiscounted: params.amountDiscounted,
    currency: params.currency,
    createdAt: new Date(),
  })

  await db.collection<Coupon>("coupons").updateOne(
    { code },
    { $inc: { usedCount: 1 }, $set: { updatedAt: new Date() } }
  )
}

export async function addUserCredit(params: {
  email: string
  amount: number
  currency: "INR" | "USD"
  type: CreditTransaction["type"]
  referenceOrderId?: string
}): Promise<void> {
  const db = await getDb()

  const incField = params.currency === "INR" ? "creditBalanceINR" : "creditBalanceUSD"
  await db.collection<User>("users").updateOne(
    { email: params.email },
    { $inc: { [incField]: params.amount }, $set: { updatedAt: new Date() } }
  )

  await db.collection<CreditTransaction>("credit_transactions").insertOne({
    email: params.email,
    amount: params.amount,
    currency: params.currency,
    type: params.type,
    referenceOrderId: params.referenceOrderId,
    createdAt: new Date(),
  })
}

export async function recordReferralReward(params: {
  referrerEmail: string
  referredEmail: string
  orderId: string
  rewardAmount: number
  currency: "INR" | "USD"
}): Promise<void> {
  const db = await getDb()
  await db.collection<ReferralReward>("referral_rewards").insertOne({
    referrerEmail: params.referrerEmail,
    referredEmail: params.referredEmail,
    orderId: params.orderId,
    rewardAmount: params.rewardAmount,
    currency: params.currency,
    createdAt: new Date(),
  })
}

// Advertisement functions
export async function createAdvertisement(
  adData: Omit<Advertisement, "_id" | "createdAt" | "updatedAt" | "views" | "clicks" | "status">
): Promise<Advertisement> {
  const db = await getDb()
  const now = new Date()
  const document: Advertisement = {
    ...adData,
    views: 0,
    clicks: 0,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  }

  const result = await db.collection<Advertisement>("advertisements").insertOne(document)
  return { ...document, _id: result.insertedId }
}

export async function getAdvertisementsByEmail(email: string): Promise<Advertisement[]> {
  const db = await getDb()
  return db.collection<Advertisement>("advertisements").find({ email }).sort({ createdAt: -1 }).toArray()
}

export async function updateAdvertisement(
  adId: string,
  update: Partial<Advertisement>
): Promise<Advertisement | null> {
  const db = await getDb()
  const result = await db
    .collection<Advertisement>("advertisements")
    .findOneAndUpdate(
      { _id: new ObjectId(adId) },
      { $set: { ...update, updatedAt: new Date() } },
      { returnDocument: "after" }
    )
  return result
}

export async function incrementAdViews(adId: string): Promise<void> {
  const db = await getDb()
  await db.collection<Advertisement>("advertisements").updateOne(
    { _id: new ObjectId(adId) },
    { $inc: { views: 1 }, $set: { updatedAt: new Date() } }
  )
}

export async function incrementAdClicks(adId: string): Promise<void> {
  const db = await getDb()
  await db.collection<Advertisement>("advertisements").updateOne(
    { _id: new ObjectId(adId) },
    { $inc: { clicks: 1 }, $set: { updatedAt: new Date() } }
  )
}

export async function updateAdTracking(adId: string, action: 'click' | 'view'): Promise<Advertisement | null> {
  const db = await getDb()
  const updateField = action === 'click' ? 'clicks' : 'views'
  
  const result = await db
    .collection<Advertisement>("advertisements")
    .findOneAndUpdate(
      { _id: new ObjectId(adId) },
      { 
        $inc: { [updateField]: 1 }, 
        $set: { updatedAt: new Date() } 
      },
      { returnDocument: "after" }
    )
  return result
}

export async function getActiveAdvertisements(): Promise<Advertisement[]> {
  const db = await getDb()
  const now = new Date()
  return db.collection<Advertisement>("advertisements").find({
    status: "active",
    endDate: { $gte: now }
  }).toArray()
}

// Car Project functions
export async function createCarProject(
  projectData: Omit<CarProject, "_id" | "createdAt" | "updatedAt" | "lastAccessedAt">
): Promise<CarProject> {
  const db = await getDb()
  const now = new Date()
  const document: CarProject = {
    ...projectData,
    createdAt: now,
    updatedAt: now,
    lastAccessedAt: now,
  }

  const result = await db.collection<CarProject>("car_projects").insertOne(document)
  return { ...document, _id: result.insertedId }
}

export async function getCarProjectById(projectId: string): Promise<CarProject | null> {
  const db = await getDb()
  return db.collection<CarProject>("car_projects").findOne({ _id: new ObjectId(projectId) })
}

export async function getCarProjectsByEmail(email: string): Promise<CarProject[]> {
  const db = await getDb()
  return db.collection<CarProject>("car_projects")
    .find({ email })
    .sort({ lastAccessedAt: -1 })
    .toArray()
}

/**
 * Fetch all projects visible to a user: those owned directly by their email
 * AND any owned by their team (when they belong to one).
 */
export async function getCarProjectsForWorkspace(email: string): Promise<CarProject[]> {
  const db = await getDb()
  const user = await db.collection<User>("users").findOne({ email })
  const filters: Record<string, unknown>[] = [{ email }]
  if (user?.teamId) filters.push({ teamId: user.teamId })
  return db
    .collection<CarProject>("car_projects")
    .find({ $or: filters })
    .sort({ lastAccessedAt: -1 })
    .toArray()
}

export async function updateCarProject(
  projectId: string,
  update: Partial<CarProject>
): Promise<CarProject | null> {
  const db = await getDb()
  const result = await db
    .collection<CarProject>("car_projects")
    .findOneAndUpdate(
      { _id: new ObjectId(projectId) },
      { $set: { ...update, updatedAt: new Date(), lastAccessedAt: new Date() } },
      { returnDocument: "after" }
    )
  return result
}

export async function deleteCarProject(projectId: string): Promise<void> {
  const db = await getDb()
  await db.collection<CarProject>("car_projects").deleteOne({ _id: new ObjectId(projectId) })
}

export async function incrementProjectsUsed(email: string): Promise<void> {
  const db = await getDb()
  await db.collection<User>("users").updateOne(
    { email },
    { $inc: { projectsUsed: 1 }, $set: { updatedAt: new Date() } }
  )
}

// ─── Car Catalog ────────────────────────────────────────────────────────────

export interface CarCatalogImage2D {
  id: string
  label: string   // "Front View", "Side Left", etc.
  url: string
  angle: string   // "front" | "side-left" | "side-right" | "rear" | "top" | "3q-front" | "3q-rear"
}

export interface CarCatalog {
  _id?: ObjectId
  make: string
  model: string
  year?: string           // "2020" or "2019-2023"
  slug: string            // "toyota-supra" — unique lookup key
  thumbnailUrl: string
  model3dUrl: string      // GLTF/GLB URL
  images2d: CarCatalogImage2D[]
  accessoryIds: string[]  // ObjectId strings referencing accessories_catalog
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface AccessoryCatalog {
  _id?: ObjectId
  name: string
  category: string        // "Spoilers" | "Side Skirts" | "Front Lips" | "Antennas" | "Roof Racks" | "Other"
  accessoryType: "3d" | "2d" | "both"
  model3dUrl: string      // GLTF/GLB URL
  image2dUrl: string      // PNG for 2D canvas overlay
  thumbnailUrl: string
  defaultPosition3d: [number, number, number]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export function makeCarSlug(make: string, model: string): string {
  return `${make}-${model}`.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
}

export async function getCarCatalogList(activeOnly = false): Promise<CarCatalog[]> {
  const db = await getDb()
  const filter = activeOnly ? { isActive: true } : {}
  return db.collection<CarCatalog>("car_catalog").find(filter).sort({ make: 1, model: 1 }).toArray()
}

export async function getCarCatalogBySlug(slug: string): Promise<CarCatalog | null> {
  const db = await getDb()
  return db.collection<CarCatalog>("car_catalog").findOne({ slug, isActive: true })
}

export async function getCarCatalogById(id: string): Promise<CarCatalog | null> {
  if (!ObjectId.isValid(id)) return null
  const db = await getDb()
  return db.collection<CarCatalog>("car_catalog").findOne({ _id: new ObjectId(id) })
}

export async function createCarCatalog(data: Omit<CarCatalog, "_id" | "createdAt" | "updatedAt">): Promise<CarCatalog> {
  const db = await getDb()
  const now = new Date()
  const doc: CarCatalog = { ...data, createdAt: now, updatedAt: now }
  const result = await db.collection<CarCatalog>("car_catalog").insertOne(doc)
  return { ...doc, _id: result.insertedId }
}

export async function updateCarCatalog(id: string, data: Partial<CarCatalog>): Promise<CarCatalog | null> {
  if (!ObjectId.isValid(id)) return null
  const db = await getDb()
  const result = await db.collection<CarCatalog>("car_catalog").findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { ...data, updatedAt: new Date() } },
    { returnDocument: "after" }
  )
  return result
}

export async function deleteCarCatalog(id: string): Promise<void> {
  if (!ObjectId.isValid(id)) return
  const db = await getDb()
  await db.collection<CarCatalog>("car_catalog").deleteOne({ _id: new ObjectId(id) })
}

// ─── Accessories Catalog ─────────────────────────────────────────────────────

export async function getAccessoriesList(activeOnly = false): Promise<AccessoryCatalog[]> {
  const db = await getDb()
  const filter = activeOnly ? { isActive: true } : {}
  return db.collection<AccessoryCatalog>("accessories_catalog").find(filter).sort({ category: 1, name: 1 }).toArray()
}

export async function getAccessoriesByIds(ids: string[]): Promise<AccessoryCatalog[]> {
  if (!ids.length) return []
  const db = await getDb()
  const objectIds = ids.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id))
  return db.collection<AccessoryCatalog>("accessories_catalog").find({ _id: { $in: objectIds } }).toArray()
}

export async function getAccessoryById(id: string): Promise<AccessoryCatalog | null> {
  if (!ObjectId.isValid(id)) return null
  const db = await getDb()
  return db.collection<AccessoryCatalog>("accessories_catalog").findOne({ _id: new ObjectId(id) })
}

export async function createAccessory(data: Omit<AccessoryCatalog, "_id" | "createdAt" | "updatedAt">): Promise<AccessoryCatalog> {
  const db = await getDb()
  const now = new Date()
  const doc: AccessoryCatalog = { ...data, createdAt: now, updatedAt: now }
  const result = await db.collection<AccessoryCatalog>("accessories_catalog").insertOne(doc)
  return { ...doc, _id: result.insertedId }
}

export async function updateAccessory(id: string, data: Partial<AccessoryCatalog>): Promise<AccessoryCatalog | null> {
  if (!ObjectId.isValid(id)) return null
  const db = await getDb()
  const result = await db.collection<AccessoryCatalog>("accessories_catalog").findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { ...data, updatedAt: new Date() } },
    { returnDocument: "after" }
  )
  return result
}

export async function deleteAccessory(id: string): Promise<void> {
  if (!ObjectId.isValid(id)) return
  const db = await getDb()
  await db.collection<AccessoryCatalog>("accessories_catalog").deleteOne({ _id: new ObjectId(id) })
}

// ─── Admin Helpers ────────────────────────────────────────────────────────────

export async function getUsersList(skip = 0, limit = 100): Promise<User[]> {
  const db = await getDb()
  return db.collection<User>("users")
    .find({}, { projection: { password: 0 } })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray()
}

export async function getUsersCount(): Promise<number> {
  const db = await getDb()
  return db.collection<User>("users").countDocuments()
}

export async function deleteUser(email: string): Promise<void> {
  const db = await getDb()
  await db.collection<User>("users").deleteOne({ email })
}

export async function getAllAdvertisements(): Promise<Advertisement[]> {
  const db = await getDb()
  return db.collection<Advertisement>("advertisements").find({}).sort({ createdAt: -1 }).toArray()
}

export async function getAllCarProjects(skip = 0, limit = 100): Promise<CarProject[]> {
  const db = await getDb()
  return db.collection<CarProject>("car_projects")
    .find({})
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray()
}

/** Admin list with optional owner filter; sorted by last activity. */
export async function getCarProjectsAdminQuery(params: {
  ownerEmail?: string
  skip?: number
  limit?: number
}): Promise<CarProject[]> {
  const db = await getDb()
  const filter = params.ownerEmail ? { email: params.ownerEmail } : {}
  const skip = params.skip ?? 0
  const limit = Math.min(params.limit ?? 100, 500)
  return db
    .collection<CarProject>("car_projects")
    .find(filter)
    .sort({ lastAccessedAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray()
}

export async function getCarProjectsAdminCount(ownerEmail?: string): Promise<number> {
  const db = await getDb()
  const filter = ownerEmail ? { email: ownerEmail } : {}
  return db.collection<CarProject>("car_projects").countDocuments(filter)
}

export async function getCarProjectsCount(): Promise<number> {
  const db = await getDb()
  return db.collection<CarProject>("car_projects").countDocuments()
}

export async function getAllPurchaseOrders(skip = 0, limit = 200): Promise<PurchaseOrder[]> {
  const db = await getDb()
  return db.collection<PurchaseOrder>("purchase_orders")
    .find({})
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray()
}

// ─── Webhook Idempotency Helpers ─────────────────────────────────────────────

export async function isWebhookProcessed(
  provider: WebhookEvent["provider"],
  eventId: string,
): Promise<boolean> {
  const db = await getDb()
  const found = await db
    .collection<WebhookEvent>("webhook_events")
    .findOne({ provider, eventId })
  return !!found
}

export async function markWebhookProcessed(
  provider: WebhookEvent["provider"],
  eventId: string,
  eventName?: string,
): Promise<void> {
  const db = await getDb()
  try {
    await db.collection<WebhookEvent>("webhook_events").insertOne({
      provider,
      eventId,
      eventName,
      processedAt: new Date(),
    })
  } catch (err: unknown) {
    // Duplicate key errors are expected on retries; ignore.
    const code = (err as { code?: number })?.code
    if (code !== 11000) throw err
  }
}

// ─── Project + project counter helpers (for plan enforcement) ────────────────

export async function getCarProjectsCountForEmail(email: string): Promise<number> {
  const db = await getDb()
  return db.collection<CarProject>("car_projects").countDocuments({ email })
}

export async function decrementProjectsUsed(email: string): Promise<void> {
  const db = await getDb()
  await db.collection<User>("users").updateOne(
    { email, projectsUsed: { $gt: 0 } },
    { $inc: { projectsUsed: -1 }, $set: { updatedAt: new Date() } },
  )
}

export async function syncProjectsUsedFromCount(email: string): Promise<number> {
  const db = await getDb()
  const count = await getCarProjectsCountForEmail(email)
  await db.collection<User>("users").updateOne(
    { email },
    { $set: { projectsUsed: count, updatedAt: new Date() } },
  )
  return count
}

export { getClientPromise as clientPromise }
