import "server-only"
import { MongoClient, Db, ObjectId } from "mongodb"
import { getPlanById } from "./products"

const uri = process.env.MONGODB_URI || ""
const options = {}

let client: MongoClient | null = null
let clientPromise: Promise<MongoClient> | null = null

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined
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
  return client.db("saas-platform")
}

// Check if MongoDB is configured
export function isDbConfigured(): boolean {
  return !!process.env.MONGODB_URI
}

// User types
export interface User {
  _id?: ObjectId
  email: string
  password: string
  name: string
  country: "IN" | "US" | null
  planType: "free" | "1-project" | "5-projects" | "50-projects" | "100-projects" | "business"
  projectLimit: number
  projectsUsed: number
  subscriptionExpiry: Date | null
  lemonSqueezyCustomerId: string | null
  lemonSqueezySubscriptionId: string | null
  razorpayCustomerId: string | null
  referralCode: string | null
  referredByCode: string | null
  creditBalanceINR: number
  creditBalanceUSD: number
  createdAt: Date
  updatedAt: Date
}

export interface PurchaseOrder {
  _id?: ObjectId
  orderId: string
  email: string
  planId: string
  provider: "razorpay"
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
  providerPaymentId: string
): Promise<User | null> {
  const user = await getUserByEmail(email)
  if (!user) return null

  const plan = getPlanById(planId)
  if (!plan) return null

  const now = new Date()
  const baseDate =
    user.subscriptionExpiry && user.subscriptionExpiry > now
      ? new Date(user.subscriptionExpiry)
      : now

  baseDate.setDate(baseDate.getDate() + 30)

  return updateUser(email, {
    planType: plan.id as User["planType"],
    projectLimit: plan.projectLimit,
    subscriptionExpiry: baseDate,
    razorpayCustomerId: providerPaymentId,
  })
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

export { getClientPromise as clientPromise }
