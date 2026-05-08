import "server-only"

import { ObjectId } from "mongodb"
import { getDb, type TemplateDrop } from "./db"

export async function listActiveTemplates(limit = 12): Promise<TemplateDrop[]> {
  const db = await getDb()
  return db
    .collection<TemplateDrop>("template_drops")
    .find({ isActive: true })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .toArray()
}

export async function listAllTemplates(): Promise<TemplateDrop[]> {
  const db = await getDb()
  return db
    .collection<TemplateDrop>("template_drops")
    .find({})
    .sort({ publishedAt: -1 })
    .toArray()
}

export async function createTemplateDrop(
  data: Omit<TemplateDrop, "_id" | "createdAt" | "updatedAt" | "publishedAt"> & {
    publishedAt?: Date
  },
): Promise<TemplateDrop> {
  const db = await getDb()
  const now = new Date()
  const doc: Omit<TemplateDrop, "_id"> = {
    ...data,
    publishedAt: data.publishedAt ?? now,
    createdAt: now,
    updatedAt: now,
  }
  const result = await db
    .collection<TemplateDrop>("template_drops")
    .insertOne(doc as TemplateDrop)
  return { ...doc, _id: result.insertedId }
}

export async function updateTemplateDrop(
  id: string,
  patch: Partial<TemplateDrop>,
): Promise<TemplateDrop | null> {
  if (!ObjectId.isValid(id)) return null
  const db = await getDb()
  const result = await db.collection<TemplateDrop>("template_drops").findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { ...patch, updatedAt: new Date() } },
    { returnDocument: "after" },
  )
  return result
}

export async function deleteTemplateDrop(id: string): Promise<void> {
  if (!ObjectId.isValid(id)) return
  const db = await getDb()
  await db.collection<TemplateDrop>("template_drops").deleteOne({ _id: new ObjectId(id) })
}
