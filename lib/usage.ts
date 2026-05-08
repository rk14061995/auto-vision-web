import "server-only"

import { getDb, type UsageEvent, type UsageEventType, type User } from "./db"

const COUNTER_FIELD: Partial<Record<UsageEventType, keyof NonNullable<User["usageMetrics"]>>> = {
  project_created: "projectsCreated",
  project_exported: "exports",
  ai_call: "aiCalls",
  project_shared: "sharesLastMonth",
}

/** Write a usage event and (best-effort) bump the user's rolling counter. */
export async function writeUsageEvent(
  email: string,
  type: UsageEventType,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const db = await getDb()
  const now = new Date()
  await db.collection<UsageEvent>("usage_events").insertOne({
    email,
    type,
    metadata,
    createdAt: now,
  })
  const counter = COUNTER_FIELD[type]
  if (counter) {
    await db.collection<User>("users").updateOne(
      { email },
      {
        $inc: { [`usageMetrics.${counter}`]: 1 },
        $set: { updatedAt: now },
      },
    )
  }
}
