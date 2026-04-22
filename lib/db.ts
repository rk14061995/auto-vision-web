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
  createdAt: Date
  updatedAt: Date
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
  return { ...document, _id: result.insertedId.toString() }
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

export { getClientPromise as clientPromise }
