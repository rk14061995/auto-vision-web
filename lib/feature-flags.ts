// Feature gating matrix. Resolves whether a given user (by tier) can use a
// premium capability and which tier they should upgrade to.

import { PLAN_BY_TIER, planRank, type Plan } from "./plans"
import type { PlanTier, User } from "./db"

export type Feature =
  | "export_4k"
  | "export_8k"
  | "remove_watermark"
  | "ai_tools"
  | "ai_wrap_generation"
  | "premium_assets"
  | "premium_wraps"
  | "background_removal"
  | "version_history"
  | "private_uploads"
  | "advanced_layers"
  | "team_collab"
  | "white_label"
  | "client_approval"
  | "brand_kit"
  | "lead_capture"
  | "commercial_license"
  | "api_access"
  | "sso"
  | "priority_rendering"
  | "priority_support"

export interface CanUseResult {
  allowed: boolean
  reason?: string
  upsellTo?: PlanTier
}

interface UserLike {
  planTier?: PlanTier
  planType?: string
}

/** Resolve the canonical PlanTier for a user, falling back to legacy planType mapping. */
export function resolveTier(user: UserLike | null | undefined): PlanTier {
  if (!user) return "free"
  if (user.planTier) return user.planTier
  switch (user.planType) {
    case "free":
      return "free"
    case "1-project":
    case "5-projects":
      return "creator"
    case "50-projects":
      return "pro"
    case "100-projects":
      return "studio"
    case "business":
      return "enterprise"
    case "creator":
    case "pro":
    case "studio":
    case "enterprise":
      return user.planType as PlanTier
    default:
      return "free"
  }
}

function planSupports(plan: Plan, feature: Feature): boolean {
  const f = plan.features
  switch (feature) {
    case "export_4k":
      return plan.features.exportResolution === "4k" || plan.features.exportResolution === "8k"
    case "export_8k":
      return plan.features.exportResolution === "8k"
    case "remove_watermark":
      return !f.watermark
    case "ai_tools":
      return f.aiTools
    case "ai_wrap_generation":
      return f.aiWrapGeneration
    case "premium_assets":
      return f.premiumAssets
    case "premium_wraps":
      return f.premiumWraps
    case "background_removal":
      return f.backgroundRemoval
    case "version_history":
      return f.versionHistory
    case "private_uploads":
      return f.privateAssetLibrary
    case "advanced_layers":
      return f.advancedLayers
    case "team_collab":
      return f.teamCollab
    case "white_label":
      return f.whiteLabel
    case "client_approval":
      return f.clientApprovalWorkflow
    case "brand_kit":
      return f.brandKit
    case "lead_capture":
      return f.leadCapture
    case "commercial_license":
      return f.commercialLicense
    case "api_access":
      return f.apiAccess
    case "sso":
      return f.ssoIntegration
    case "priority_rendering":
      return f.priorityRendering
    case "priority_support":
      return f.prioritySupport
    default:
      return false
  }
}

/** Lowest plan tier that supports the given feature. */
export function minimumTierFor(feature: Feature): PlanTier {
  const tiers: PlanTier[] = ["free", "creator", "pro", "studio", "enterprise"]
  for (const tier of tiers) {
    if (planSupports(PLAN_BY_TIER[tier], feature)) return tier
  }
  return "enterprise"
}

export function canUse(
  user: UserLike | null | undefined,
  feature: Feature,
): CanUseResult {
  const tier = resolveTier(user)
  const plan = PLAN_BY_TIER[tier]
  if (planSupports(plan, feature)) return { allowed: true }
  const upsellTo = minimumTierFor(feature)
  return {
    allowed: false,
    reason: `${plan.name} plan does not include this feature.`,
    upsellTo,
  }
}

export function tierHasFeature(tier: PlanTier, feature: Feature): boolean {
  return planSupports(PLAN_BY_TIER[tier], feature)
}

export function isAtLeastTier(user: UserLike | null | undefined, target: PlanTier): boolean {
  return planRank(resolveTier(user)) >= planRank(target)
}

export function getEffectiveProjectLimit(user: User | UserLike): number {
  const tier = resolveTier(user)
  const planLimit = PLAN_BY_TIER[tier].projectLimit
  // Grandfathered users may have higher project limits than the new tier
  // standard; respect the one stored on the user document.
  const userLimit = (user as User).projectLimit
  if (typeof userLimit === "number" && userLimit !== 0) {
    if (planLimit === -1 || userLimit === -1) return -1
    return Math.max(planLimit, userLimit)
  }
  return planLimit
}
