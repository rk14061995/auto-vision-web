"use server"

import { hash } from "bcryptjs"
import crypto from "node:crypto"
import { cookies } from "next/headers"
import { createUser, getUserByEmail } from "@/lib/db"
import { signIn } from "@/lib/auth"
import { computeFreePlanExpiresAt } from "@/lib/subscription-access"

export async function signup(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const name = formData.get("name") as string

  if (!email || !password || !name) {
    return { error: "All fields are required" }
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" }
  }

  // Check if MongoDB is configured
  if (!process.env.MONGODB_URI) {
    return { error: "Database not configured. Please add MONGODB_URI in Settings > Vars." }
  }

  try {
    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return { error: "Email already registered" }
    }

    const hashedPassword = await hash(password, 12)

    const cookieStore = await cookies()
    const referredByCode = cookieStore.get("ref")?.value ?? null
    const referralCode = crypto.randomBytes(5).toString("hex").toUpperCase()
    const now = new Date()

    const monthlyResetAt = new Date(now)
    monthlyResetAt.setMonth(monthlyResetAt.getMonth() + 1)

    await createUser({
      email,
      password: hashedPassword,
      name,
      country: null,
      planType: "free",
      planTier: "free",
      billingCycle: null,
      projectLimit: 3,
      projectsUsed: 0,
      subscriptionExpiry: computeFreePlanExpiresAt(now),
      pendingDowngradeTo: null,
      pendingDowngradeAt: null,
      dunning: false,
      lemonSqueezyCustomerId: null,
      lemonSqueezySubscriptionId: null,
      razorpayCustomerId: null,
      razorpayLastPaymentId: null,
      referralCode,
      referredByCode,
      creditBalanceINR: 0,
      creditBalanceUSD: 0,
      aiCreditsMonthly: 5, // free tier default
      aiCreditsPurchased: 0,
      aiCreditsResetAt: monthlyResetAt,
      teamId: null,
      teamRole: null,
      commercialLicense: false,
      legacyGrandfathered: false,
      legacyMigratedAt: now,
      usageMetrics: {
        projectsCreated: 0,
        exports: 0,
        aiCalls: 0,
        sharesLastMonth: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return { success: true }
  } catch (error) {
    console.error("Signup error:", error)
    return { error: "Database connection failed. Please check MONGODB_URI configuration." }
  }
}

export async function login(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "All fields are required" }
  }

  // Check if MongoDB is configured
  if (!process.env.MONGODB_URI) {
    return { error: "Database not configured. Please add MONGODB_URI in Settings > Vars." }
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    })
    return { success: true }
  } catch {
    return { error: "Invalid email or password" }
  }
}
