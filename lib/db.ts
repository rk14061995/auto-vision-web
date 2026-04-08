import "server-only"
import { MongoClient, Db, ObjectId } from "mongodb"

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

export { getClientPromise as clientPromise }
