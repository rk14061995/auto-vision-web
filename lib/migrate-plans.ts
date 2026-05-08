import "server-only"

import { getDb, type LegacyPlanId, type PlanTier, type User } from "./db"
import { PLAN_BY_TIER } from "./plans"

interface MigrationMapping {
  newTier: PlanTier
  /** -1 = unlimited; 0 = follow tier default. */
  grandfatherProjectLimit: number
}

const LEGACY_TO_NEW: Record<LegacyPlanId, MigrationMapping> = {
  free: { newTier: "free", grandfatherProjectLimit: 0 },
  "1-project": { newTier: "creator", grandfatherProjectLimit: 0 },
  "5-projects": { newTier: "creator", grandfatherProjectLimit: 5 },
  "50-projects": { newTier: "pro", grandfatherProjectLimit: 50 },
  "100-projects": { newTier: "studio", grandfatherProjectLimit: 100 },
  business: { newTier: "studio", grandfatherProjectLimit: -1 },
  // Already-new tiers: idempotent passthroughs.
  creator: { newTier: "creator", grandfatherProjectLimit: 0 },
  pro: { newTier: "pro", grandfatherProjectLimit: 0 },
  studio: { newTier: "studio", grandfatherProjectLimit: 0 },
  enterprise: { newTier: "enterprise", grandfatherProjectLimit: 0 },
}

export interface MigratedUserResult {
  email: string
  fromPlan: LegacyPlanId
  toTier: PlanTier
  projectLimit: number
  monthlyAiGranted: number
}

/**
 * Idempotent migration. Skips users where legacyMigratedAt is already set or
 * the user already has planTier populated.
 */
export async function migrateUserToNewPlans(user: User): Promise<MigratedUserResult | null> {
  if (user.legacyMigratedAt && user.planTier) return null

  const mapping = LEGACY_TO_NEW[user.planType] ?? LEGACY_TO_NEW.free
  const newPlan = PLAN_BY_TIER[mapping.newTier]
  const grandfatherLimit = mapping.grandfatherProjectLimit
  const planDefaultLimit = newPlan.projectLimit
  const finalLimit =
    grandfatherLimit === 0
      ? planDefaultLimit
      : grandfatherLimit === -1
      ? -1
      : Math.max(grandfatherLimit, planDefaultLimit === -1 ? grandfatherLimit : planDefaultLimit)

  const now = new Date()
  const resetAt = new Date(now)
  resetAt.setMonth(resetAt.getMonth() + 1)

  const monthlyAi = newPlan.monthlyAiCredits

  const db = await getDb()
  await db.collection<User>("users").updateOne(
    { email: user.email },
    {
      $set: {
        planTier: mapping.newTier,
        planType: mapping.newTier,
        projectLimit: finalLimit,
        billingCycle: user.billingCycle ?? null,
        aiCreditsMonthly: monthlyAi,
        aiCreditsPurchased: user.aiCreditsPurchased ?? 0,
        aiCreditsResetAt: resetAt,
        commercialLicense: user.commercialLicense ?? newPlan.features.commercialLicense,
        legacyGrandfathered: grandfatherLimit !== 0 || user.planType !== "free",
        legacyMigratedAt: now,
        usageMetrics: user.usageMetrics ?? {
          projectsCreated: 0,
          exports: 0,
          aiCalls: 0,
          sharesLastMonth: 0,
        },
        updatedAt: now,
      },
    },
  )

  return {
    email: user.email,
    fromPlan: user.planType,
    toTier: mapping.newTier,
    projectLimit: finalLimit,
    monthlyAiGranted: monthlyAi,
  }
}

/** Migrate every user in the collection. Used by admin endpoint. */
export async function migrateAllUsers(): Promise<{
  total: number
  migrated: number
  skipped: number
  results: MigratedUserResult[]
}> {
  const db = await getDb()
  const users = await db.collection<User>("users").find({}).toArray()
  const results: MigratedUserResult[] = []
  let skipped = 0
  for (const user of users) {
    const result = await migrateUserToNewPlans(user)
    if (result) results.push(result)
    else skipped += 1
  }
  return {
    total: users.length,
    migrated: results.length,
    skipped,
    results,
  }
}

/** Lightweight resolver used in JWT auto-migrate path. Returns the updated
 * user if migration was performed, otherwise null. */
export async function migrateUserIfNeeded(email: string): Promise<User | null> {
  const db = await getDb()
  const user = await db.collection<User>("users").findOne({ email })
  if (!user) return null
  if (user.legacyMigratedAt && user.planTier) return null
  await migrateUserToNewPlans(user)
  return db.collection<User>("users").findOne({ email })
}
