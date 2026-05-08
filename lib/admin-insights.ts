import "server-only"

import { getDb, type CarProject, type UsageEvent, type User } from "./db"

export interface UsageTypeAggregate {
  type: string
  count: number
}

export interface CarMakeInterest {
  make: string
  projectCount: number
  uniqueOwners: number
}

export interface RecentActivityRow {
  email: string
  type: string
  createdAt: Date
  metadata?: Record<string, unknown>
}

/** Event counts since `since` (inclusive). */
export async function aggregateUsageByType(since: Date): Promise<UsageTypeAggregate[]> {
  const db = await getDb()
  const rows = await db
    .collection<UsageEvent>("usage_events")
    .aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: "$type", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { _id: 0, type: "$_id", count: 1 } },
    ])
    .toArray()
  return rows as UsageTypeAggregate[]
}

/** Top car makes across all projects (interest signal). */
export async function aggregatePopularCarMakes(limit = 15): Promise<CarMakeInterest[]> {
  const db = await getDb()
  const rows = await db
    .collection<CarProject>("car_projects")
    .aggregate([
      { $match: { "carDetails.make": { $exists: true, $nin: ["", null] } } },
      {
        $group: {
          _id: "$carDetails.make",
          projectCount: { $sum: 1 },
          owners: { $addToSet: "$email" },
        },
      },
      { $sort: { projectCount: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          make: "$_id",
          projectCount: 1,
          uniqueOwners: { $size: "$owners" },
        },
      },
    ])
    .toArray()

  return rows as CarMakeInterest[]
}

export async function getRecentUsageAcrossUsers(limit = 40): Promise<RecentActivityRow[]> {
  const db = await getDb()
  return db
    .collection<UsageEvent>("usage_events")
    .find({}, { projection: { email: 1, type: 1, metadata: 1, createdAt: 1 } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray() as Promise<RecentActivityRow[]>
}

export async function getUsageEventsForUser(
  email: string,
  limit = 100,
): Promise<UsageEvent[]> {
  const db = await getDb()
  return db
    .collection<UsageEvent>("usage_events")
    .find({ email })
    .sort({ createdAt: -1 })
    .limit(Math.min(limit, 500))
    .toArray()
}

/** Per-user: how often each event type fired (all time, capped scan). */
export async function aggregateUsageTypesForUser(email: string): Promise<UsageTypeAggregate[]> {
  const db = await getDb()
  const rows = await db
    .collection<UsageEvent>("usage_events")
    .aggregate([
      { $match: { email } },
      { $group: { _id: "$type", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { _id: 0, type: "$_id", count: 1 } },
    ])
    .toArray()
  return rows as UsageTypeAggregate[]
}

/** Per-user: car makes they work on (from projects). */
export async function getUserCarMakeInterests(email: string): Promise<{ make: string; count: number }[]> {
  const db = await getDb()
  const rows = await db
    .collection<CarProject>("car_projects")
    .aggregate([
      { $match: { email } },
      {
        $group: {
          _id: { $trim: { input: "$carDetails.make" } },
          count: { $sum: 1 },
        },
      },
      { $match: { _id: { $ne: "" } } },
      { $sort: { count: -1 } },
      { $limit: 12 },
      { $project: { _id: 0, make: "$_id", count: 1 } },
    ])
    .toArray()
  return rows as { make: string; count: number }[]
}

/** AI / checkout / plan signals derived from events (one row per logical touch). */
export async function getUserFeatureTouchesFromEvents(
  email: string,
): Promise<{ key: string; count: number }[]> {
  const db = await getDb()
  const rows = await db
    .collection<UsageEvent>("usage_events")
    .aggregate([
      { $match: { email } },
      { $addFields: { eventType: "$type" } },
      {
        $addFields: {
          interestKey: {
            $switch: {
              branches: [
                {
                  case: { $ne: [{ $ifNull: ["$metadata.feature", null] }, null] },
                  then: { $concat: ["ai:", { $toString: "$metadata.feature" }] },
                },
                {
                  case: { $ne: [{ $ifNull: ["$metadata.kind", null] }, null] },
                  then: { $concat: ["checkout:", { $toString: "$metadata.kind" }] },
                },
                {
                  case: { $ne: [{ $ifNull: ["$metadata.planId", null] }, null] },
                  then: { $concat: ["plan:", { $toString: "$metadata.planId" }] },
                },
              ],
              default: { $concat: ["event:", "$eventType"] },
            },
          },
        },
      },
      { $group: { _id: "$interestKey", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 24 },
      { $project: { _id: 0, key: "$_id", count: 1 } },
    ])
    .toArray()
  return rows as { key: string; count: number }[]
}

export async function getUserForAdminInsights(email: string): Promise<User | null> {
  const db = await getDb()
  return db.collection<User>("users").findOne({ email }, { projection: { password: 0 } })
}
