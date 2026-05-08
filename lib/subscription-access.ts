/** Free tier trial length from account start (or downgrade date). */
export const FREE_PLAN_VALIDITY_DAYS = 7

export function computeFreePlanExpiresAt(from: Date = new Date()): Date {
  const d = new Date(from)
  d.setDate(d.getDate() + FREE_PLAN_VALIDITY_DAYS)
  return d
}

/**
 * True when the user must not create new projects (paid past end, or free without/past trial).
 */
export function isSubscriptionAccessExpired(
  planType: string,
  subscriptionExpiry: Date | null
): boolean {
  if (!subscriptionExpiry) {
    if (planType === "free") return true
    return false
  }
  return new Date(subscriptionExpiry) < new Date()
}
