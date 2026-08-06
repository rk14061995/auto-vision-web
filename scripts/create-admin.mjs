/**
 * Create an admin user account — a normal `users` document (same shape as
 * the real /signup flow in app/actions/auth.ts) plus adding the email to
 * ADMIN_EMAILS, since admin access = "your logged-in email is in that list"
 * (see checkAdmin() in the various app/api/admin/* routes). There's no
 * separate admin password system.
 *
 * Usage:
 *   node scripts/create-admin.mjs <email> [password]
 *
 * If password is omitted, a random one is generated and printed once —
 * it is not recoverable after this (only the bcrypt hash is stored).
 * Safe to re-run for an existing email: with no password argument it will
 * not touch an existing user's password, only ensure ADMIN_EMAILS includes
 * them. Pass a password explicitly to (re)set it, including for an
 * existing account.
 *
 * Reads/writes .env.local automatically.
 */

import { readFileSync, writeFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import crypto from "node:crypto"
import bcryptjs from "bcryptjs"
const { hash } = bcryptjs
import { MongoClient } from "mongodb"

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, "../.env.local")

function loadEnv(filePath) {
  const content = readFileSync(filePath, "utf-8")
  for (const line of content.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eqIdx = trimmed.indexOf("=")
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    let value = trimmed.slice(eqIdx + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    process.env[key] = value // last-wins, matching @next/env's handling of duplicate keys
  }
}

loadEnv(envPath)

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error("MONGODB_URI not set — check .env.local")
  process.exit(1)
}

const email = process.argv[2]
if (!email) {
  console.error("Usage: node scripts/create-admin.mjs <email> [password]")
  process.exit(1)
}
const explicitPassword = process.argv[3]
const password = explicitPassword || crypto.randomBytes(12).toString("base64url")

const FREE_PLAN_VALIDITY_DAYS = 10

async function main() {
  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  const db = client.db("saas-platform")
  const users = db.collection("users")

  const now = new Date()
  let createdNewUser = false
  let passwordChanged = false

  const existing = await users.findOne({ email })
  if (existing) {
    if (explicitPassword) {
      const hashedPassword = await hash(explicitPassword, 12)
      await users.updateOne({ email }, { $set: { password: hashedPassword, updatedAt: now } })
      passwordChanged = true
      console.log(`User ${email} already exists — password updated.`)
    } else {
      console.log(`User ${email} already exists — leaving their password untouched.`)
    }
  } else {
    const hashedPassword = await hash(password, 12)
    const monthlyResetAt = new Date(now)
    monthlyResetAt.setMonth(monthlyResetAt.getMonth() + 1)
    const subscriptionExpiry = new Date(now)
    subscriptionExpiry.setDate(subscriptionExpiry.getDate() + FREE_PLAN_VALIDITY_DAYS)

    await users.insertOne({
      email,
      password: hashedPassword,
      name: email.split("@")[0],
      country: "IN",
      planType: "free",
      planTier: "free",
      billingCycle: null,
      projectLimit: 3,
      projectsUsed: 0,
      subscriptionExpiry,
      pendingDowngradeTo: null,
      pendingDowngradeAt: null,
      dunning: false,
      paddleCustomerId: null,
      paddleSubscriptionId: null,
      lemonSqueezyCustomerId: null,
      lemonSqueezySubscriptionId: null,
      razorpayCustomerId: null,
      razorpayLastPaymentId: null,
      referralCode: crypto.randomBytes(5).toString("hex").toUpperCase(),
      referredByCode: null,
      creditBalanceINR: 0,
      creditBalanceUSD: 0,
      aiCreditsMonthly: 5,
      aiCreditsPurchased: 0,
      aiCreditsResetAt: monthlyResetAt,
      teamId: null,
      teamRole: null,
      commercialLicense: false,
      legacyGrandfathered: false,
      legacyMigratedAt: now,
      usageMetrics: { projectsCreated: 0, exports: 0, aiCalls: 0, sharesLastMonth: 0 },
      createdAt: now,
      updatedAt: now,
    })
    createdNewUser = true
    console.log(`Created user ${email}.`)
  }

  await client.close()

  // ─── Ensure ADMIN_EMAILS includes this email (.env.local, local dev only) ──
  const envContent = readFileSync(envPath, "utf-8")
  const lines = envContent.split("\n")
  let touched = false
  const updated = lines.map((line) => {
    if (line.startsWith("ADMIN_EMAILS=")) {
      const current = line.slice("ADMIN_EMAILS=".length).trim().replace(/^"|"$/g, "")
      const list = current.split(",").map((e) => e.trim()).filter(Boolean)
      if (list.includes(email)) return line
      list.push(email)
      touched = true
      return `ADMIN_EMAILS=${list.join(",")}`
    }
    return line
  })
  if (touched) {
    writeFileSync(envPath, updated.join("\n"))
    console.log(`Added ${email} to ADMIN_EMAILS in .env.local.`)
  } else {
    console.log(`${email} already in ADMIN_EMAILS (or no ADMIN_EMAILS= line found).`)
  }

  console.log("\n── Admin login ──────────────────────────")
  console.log("Email:   ", email)
  if (createdNewUser || passwordChanged) console.log("Password:", password, "(shown once — save it now)")
  else console.log("Password: (unchanged — existing account)")
  console.log("Local admin URL: http://localhost:3002/admin")
  console.log("\nThis only makes them admin in LOCAL dev (.env.local).")
  console.log("For production, add this email to ADMIN_EMAILS in Vercel → Settings → Environment Variables too.")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
