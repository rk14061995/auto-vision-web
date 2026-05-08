import "server-only"

import { ObjectId } from "mongodb"
import {
  getDb,
  type MarketplaceAsset,
  type MarketplaceAssetStatus,
  type MarketplaceAssetType,
} from "./db"

const DEFAULT_COMMISSION_PCT = 25

export interface CreateAssetInput {
  creatorEmail: string
  type: MarketplaceAssetType
  title: string
  description: string
  thumbnailUrl: string
  assetUrl: string
  premium?: boolean
  priceIN?: number
  priceUS?: number
  tags?: string[]
}

export async function createAsset(input: CreateAssetInput): Promise<MarketplaceAsset> {
  const db = await getDb()
  const now = new Date()
  const doc: Omit<MarketplaceAsset, "_id"> = {
    creatorEmail: input.creatorEmail,
    type: input.type,
    title: input.title,
    description: input.description,
    thumbnailUrl: input.thumbnailUrl,
    assetUrl: input.assetUrl,
    premium: input.premium ?? false,
    priceIN: input.priceIN ?? 0,
    priceUS: input.priceUS ?? 0,
    commissionPct: DEFAULT_COMMISSION_PCT,
    downloads: 0,
    revenueIN: 0,
    revenueUS: 0,
    rating: 0,
    ratingCount: 0,
    status: "pending",
    tags: input.tags ?? [],
    createdAt: now,
    updatedAt: now,
  }
  const result = await db.collection<MarketplaceAsset>("marketplace_assets").insertOne(doc as MarketplaceAsset)
  return { ...doc, _id: result.insertedId }
}

export async function listPublicAssets(params: {
  type?: MarketplaceAssetType
  limit?: number
  skip?: number
}): Promise<MarketplaceAsset[]> {
  const db = await getDb()
  const filter: Record<string, unknown> = { status: "approved" }
  if (params.type) filter.type = params.type
  return db
    .collection<MarketplaceAsset>("marketplace_assets")
    .find(filter)
    .sort({ downloads: -1, createdAt: -1 })
    .skip(params.skip ?? 0)
    .limit(Math.min(params.limit ?? 24, 100))
    .toArray()
}

export async function listAllAssets(): Promise<MarketplaceAsset[]> {
  const db = await getDb()
  return db
    .collection<MarketplaceAsset>("marketplace_assets")
    .find({})
    .sort({ createdAt: -1 })
    .toArray()
}

export async function getAssetById(id: string): Promise<MarketplaceAsset | null> {
  if (!ObjectId.isValid(id)) return null
  const db = await getDb()
  return db.collection<MarketplaceAsset>("marketplace_assets").findOne({ _id: new ObjectId(id) })
}

export async function updateAssetStatus(
  id: string,
  status: MarketplaceAssetStatus,
  rejectionReason?: string,
): Promise<MarketplaceAsset | null> {
  if (!ObjectId.isValid(id)) return null
  const db = await getDb()
  const result = await db.collection<MarketplaceAsset>("marketplace_assets").findOneAndUpdate(
    { _id: new ObjectId(id) },
    {
      $set: {
        status,
        rejectionReason: status === "rejected" ? rejectionReason : undefined,
        updatedAt: new Date(),
      },
    },
    { returnDocument: "after" },
  )
  return result
}

export async function updateAsset(
  id: string,
  patch: Partial<MarketplaceAsset>,
): Promise<MarketplaceAsset | null> {
  if (!ObjectId.isValid(id)) return null
  const db = await getDb()
  const result = await db.collection<MarketplaceAsset>("marketplace_assets").findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { ...patch, updatedAt: new Date() } },
    { returnDocument: "after" },
  )
  return result
}

export async function deleteAsset(id: string): Promise<void> {
  if (!ObjectId.isValid(id)) return
  const db = await getDb()
  await db.collection<MarketplaceAsset>("marketplace_assets").deleteOne({ _id: new ObjectId(id) })
}
