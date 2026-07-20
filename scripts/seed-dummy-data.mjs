/**
 * Seed script: 1000 users (500 US + 500 IN), dummy ads, marketplace assets, and reviews.
 * Run from the project root:
 *   node scripts/seed-dummy-data.mjs
 *
 * Reads MONGODB_URI from .env.local automatically.
 */

import { readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { MongoClient, ObjectId } from "mongodb"
import bcrypt from "bcryptjs"

// ─── Load .env.local ──────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, "../.env.local")

function loadEnv(filePath) {
  try {
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
      if (!process.env[key]) process.env[key] = value
    }
  } catch {
    console.warn("⚠️  Could not read .env.local — ensure MONGODB_URI is set in environment")
  }
}

loadEnv(envPath)

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not set")
  process.exit(1)
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TOTAL_USERS = 1000
const US_COUNT = 500
const IN_COUNT = 500
const PASSWORD = "hivalikanthi"
const ADS_PER_BATCH = 50     // total ads to create
const ASSETS_COUNT = 30      // marketplace assets
const REVIEWS_PER_ASSET = 15 // reviews per asset

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pad(n, digits = 5) {
  return String(n).padStart(digits, "0")
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFloat(min, max, decimals = 1) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals))
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomDate(daysBack, daysForward = 0) {
  const now = Date.now()
  const from = now - daysBack * 86400000
  const to = now + daysForward * 86400000
  return new Date(from + Math.random() * (to - from))
}

function generateReferralCode(email) {
  return email.slice(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, "X") + Math.random().toString(36).slice(2, 6).toUpperCase()
}

// ─── Static data pools ────────────────────────────────────────────────────────

const US_NAMES = [
  "James Wilson", "Emily Davis", "Michael Johnson", "Sarah Brown", "David Martinez",
  "Jessica Taylor", "Christopher Anderson", "Ashley Thomas", "Daniel Jackson", "Amanda White",
  "Matthew Harris", "Stephanie Martin", "Joshua Thompson", "Nicole Garcia", "Ryan Robinson",
  "Megan Clark", "Justin Lewis", "Lauren Lee", "Brandon Walker", "Brittany Hall",
  "Tyler Allen", "Amber Young", "Zachary Hernandez", "Samantha King", "Nathan Wright",
  "Kayla Scott", "Adam Torres", "Melissa Green", "Jacob Adams", "Rachel Baker",
]

const IN_NAMES = [
  "Arjun Sharma", "Priya Patel", "Rahul Singh", "Sneha Gupta", "Vikram Mehta",
  "Kavya Reddy", "Rohit Kumar", "Ananya Iyer", "Suresh Nair", "Divya Verma",
  "Amit Joshi", "Pooja Mishra", "Ravi Pillai", "Meera Bhat", "Sanjay Rao",
  "Nisha Desai", "Kiran Patil", "Shruti Chauhan", "Deepak Malhotra", "Anjali Shah",
  "Manish Tiwari", "Rekha Krishnan", "Vijay Sinha", "Lakshmi Agarwal", "Ramesh Yadav",
  "Sunita Kapoor", "Ashok Pandey", "Geeta Saxena", "Nikhil Chandra", "Swati Bhatt",
]

const PLAN_WEIGHTS = [
  { tier: "free", weight: 40, projectLimit: 3, aiCredits: 5 },
  { tier: "creator", weight: 30, projectLimit: 10, aiCredits: 50 },
  { tier: "pro", weight: 20, projectLimit: 50, aiCredits: 200 },
  { tier: "studio", weight: 10, projectLimit: -1, aiCredits: 500 },
]

function pickPlan() {
  const roll = randomInt(1, 100)
  let cumulative = 0
  for (const p of PLAN_WEIGHTS) {
    cumulative += p.weight
    if (roll <= cumulative) return p
  }
  return PLAN_WEIGHTS[0]
}

const AD_TYPES = ["banner", "horizontal", "square", "video", "vertical_basic", "vertical_premium", "landing_hero"]
const AD_STATUSES = ["active", "active", "active", "expired", "pending"] // weighted toward active

const US_SHOP_NAMES = [
  "RevUp Motors", "Chrome Kings Auto", "Speed Demon Garage", "Neon Rides USA",
  "Iron Wraps", "Velocity Customs", "StealthCoat Studios", "Track Day Pros",
  "Bolt Auto Works", "Phantom Vinyl", "Circuit Customs", "Apex Detail Shop",
  "GlossWorks USA", "Turbo Tint Co", "Drift King Wraps",
]
const IN_SHOP_NAMES = [
  "Speedo Car Care", "Mumbai Wraps", "Delhi Auto Studio", "Chennai Customs",
  "Hyderabad Vinyl Works", "Pune Car Wrap Co", "Bangalore Auto Art",
  "Kolkata Motors Style", "Ahmedabad Car Coat", "Jaipur Wrap Zone",
  "Kochi Auto Styling", "Surat Car Wrap", "Lucknow Auto Decor",
  "Nagpur Speed Shop", "Indore Car Spa",
]

const US_DESCRIPTIONS = [
  "Premium car wraps and custom paint protection. We specialize in full vehicle wraps, partial wraps, and ceramic coatings for all vehicle types.",
  "Your local custom auto shop offering vinyl wraps, window tinting, and detailing services. Serving the greater metro area since 2015.",
  "Race-inspired car customization studio. From track builds to show cars, we transform vehicles into rolling works of art.",
  "High-end automotive finishes. We use only 3M and Avery vinyl for long-lasting, professional results.",
  "Custom decals, full wraps, and fleet graphics. Fast turnaround and competitive pricing for personal and business vehicles.",
]
const IN_DESCRIPTIONS = [
  "Professional car wrapping services with premium imported vinyl. Full body wraps, roof wraps, and chrome finishes available.",
  "Bangalore's top car customization studio. We offer PPF, ceramic coating, vinyl wraps, and interior makeovers.",
  "Mumbai's premier auto styling center. From budget wraps to exotic finishes, we cover it all with guaranteed quality.",
  "Expert car wrap studio in Delhi NCR. Specializing in matte, satin, gloss, and brushed metal finishes for all car brands.",
  "Pune's finest car care center offering vinyl wrapping, ceramic coating, and detailing packages for all budgets.",
]

const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800",
  "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800",
  "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800",
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800",
  "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800",
  "https://images.unsplash.com/photo-1517524285303-d6fc683dddf8?w=800",
  "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800",
  "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800",
]

const ASSET_TITLES = [
  "Midnight Black Chrome Wrap", "Sunset Orange Fade", "Galaxy Blue Pearl",
  "Arctic White Matte", "Carbon Fiber Texture", "Rose Gold Satin",
  "Neon Green Sport Decal", "Military Camouflage Kit", "Holographic Rainbow",
  "Brushed Titanium Silver", "Deep Red Metallic", "Cyber Yellow",
  "Electric Blue Gloss", "Desert Sand Matte", "Gunmetal Grey Sport",
  "Candy Purple Wrap", "Ocean Teal Gradient", "Cherry Blossom Pink",
  "Stealth Black Wrap", "Urban Camo Decal", "Racing Stripe Set",
  "Gold Chrome Premium", "Emerald Forest Green", "Midnight Navy Blue",
  "Fire Red Metallic", "Ivory White Luxury", "Smoke Grey Film",
  "Lime Green Track Kit", "Bronze Copper Fade", "Diamond White Pearl",
]

const ASSET_TYPES = ["wrap", "decal", "template", "wheel_preset", "body_kit"]
const ASSET_TAGS = [
  ["sport", "matte", "premium"],
  ["glossy", "metallic", "luxury"],
  ["racing", "track", "performance"],
  ["custom", "exclusive", "limited"],
  ["urban", "street", "style"],
]

const REVIEW_TEXTS_POSITIVE = [
  "Absolutely love this wrap! The color is exactly as shown and the quality is top notch.",
  "Used this template for my BMW M3 and the result was stunning. Highly recommend!",
  "Great quality asset. Applied it seamlessly and got amazing results on my first try.",
  "Perfect color match and the texture looks incredibly realistic on the final render.",
  "This is my third purchase from this creator. Never disappointed. 5 stars always!",
  "The wrap looked so good my friends thought I actually wrapped my car in real life!",
  "Excellent value for money. Professional quality at a fraction of the cost.",
  "Used this for a client project and they were blown away. Will buy again.",
  "Crisp edges, perfect resolution, and the color saturation is amazing.",
  "The best wrap template I've found on the marketplace. Worth every credit!",
]

const REVIEW_TEXTS_NEUTRAL = [
  "Good quality but took a bit of time to align properly. Still looks great.",
  "Decent wrap template. Color is slightly different from the preview but still nice.",
  "Works well for most cars. Had minor issues with the door handles alignment.",
  "Nice template overall. Would have liked more variations included.",
  "Pretty good! Slight learning curve but once applied it looks professional.",
]

const REVIEW_TEXTS_NEGATIVE = [
  "The color doesn't quite match the thumbnail. Expected more vibrancy.",
  "Took a while to get it right. The instructions could be clearer.",
  "Decent but not as premium as described. Still usable though.",
]

// ─── Main seed function ────────────────────────────────────────────────────────

async function main() {
  console.log("🚀 Connecting to MongoDB...")
  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  const db = client.db("saas-platform")

  console.log("🔐 Hashing password...")
  const hashedPassword = await bcrypt.hash(PASSWORD, 10)

  // ── 1. Seed Users ────────────────────────────────────────────────────────────

  console.log(`\n👥 Seeding ${TOTAL_USERS} users (${US_COUNT} US + ${IN_COUNT} IN)...`)

  const userDocs = []

  for (let i = 1; i <= TOTAL_USERS; i++) {
    const isUS = i <= US_COUNT
    const country = isUS ? "US" : "IN"
    const email = `useruk0${pad(i, 4)}@yopmail.com`
    const namePool = isUS ? US_NAMES : IN_NAMES
    const name = namePool[i % namePool.length]
    const plan = pickPlan()
    const isFree = plan.tier === "free"
    const createdAt = randomDate(180) // within last 6 months
    const expiry = isFree ? null : randomDate(-60, 30) // some expired, some valid

    userDocs.push({
      email,
      password: hashedPassword,
      name,
      country,
      planType: plan.tier,
      planTier: plan.tier,
      billingCycle: isFree ? null : randomItem(["monthly", "annual"]),
      projectLimit: plan.projectLimit,
      projectsUsed: randomInt(0, Math.min(plan.projectLimit === -1 ? 10 : plan.projectLimit, 5)),
      subscriptionExpiry: expiry,
      pendingDowngradeTo: null,
      pendingDowngradeAt: null,
      dunning: false,
      paddleCustomerId: null,
      paddleSubscriptionId: null,
      lemonSqueezyCustomerId: null,
      lemonSqueezySubscriptionId: null,
      razorpayCustomerId: null,
      referralCode: generateReferralCode(email),
      referredByCode: null,
      creditBalanceINR: isUS ? 0 : randomInt(0, 500),
      creditBalanceUSD: isUS ? randomFloat(0, 25, 2) : 0,
      aiCreditsMonthly: plan.aiCredits,
      aiCreditsPurchased: randomInt(0, 50),
      aiCreditsResetAt: randomDate(-5, 25),
      teamId: null,
      teamRole: null,
      commercialLicense: plan.tier === "studio",
      adFree: plan.tier === "studio" || plan.tier === "pro",
      usageMetrics: {
        projectsCreated: randomInt(0, 10),
        exports: randomInt(0, 20),
        aiCalls: randomInt(0, 50),
        sharesLastMonth: randomInt(0, 5),
      },
      createdAt,
      updatedAt: createdAt,
    })
  }

  // Insert in batches of 100 to avoid hitting document size limits
  const BATCH = 100
  let insertedUsers = 0
  for (let i = 0; i < userDocs.length; i += BATCH) {
    const batch = userDocs.slice(i, i + BATCH)
    try {
      await db.collection("users").insertMany(batch, { ordered: false })
      insertedUsers += batch.length
    } catch (err) {
      // Ignore duplicate key errors (e.g. re-running the script)
      const inserted = err.result?.insertedCount ?? 0
      insertedUsers += inserted
      console.warn(`  ⚠️  Batch ${Math.floor(i / BATCH) + 1}: ${inserted}/${batch.length} inserted (duplicates skipped)`)
    }
    process.stdout.write(`\r  ✅ Inserted ${Math.min(i + BATCH, userDocs.length)}/${TOTAL_USERS} users`)
  }
  console.log(`\n  Done: ${insertedUsers} users inserted.`)

  // ── 2. Seed Advertisements ───────────────────────────────────────────────────

  console.log(`\n📢 Seeding ${ADS_PER_BATCH} advertisements...`)

  // Pick 50 random users to own ads (mix of US and IN)
  const usEmailsForAds = userDocs.slice(0, US_COUNT).map(u => u.email)
  const inEmailsForAds = userDocs.slice(US_COUNT).map(u => u.email)

  const adDocs = []
  for (let i = 0; i < ADS_PER_BATCH; i++) {
    const isUS = i < ADS_PER_BATCH / 2
    const email = isUS
      ? usEmailsForAds[randomInt(0, usEmailsForAds.length - 1)]
      : inEmailsForAds[randomInt(0, inEmailsForAds.length - 1)]

    const shopName = isUS
      ? US_SHOP_NAMES[i % US_SHOP_NAMES.length]
      : IN_SHOP_NAMES[i % IN_SHOP_NAMES.length]

    const shopDescription = isUS
      ? US_DESCRIPTIONS[i % US_DESCRIPTIONS.length]
      : IN_DESCRIPTIONS[i % IN_DESCRIPTIONS.length]

    const adType = randomItem(AD_TYPES)
    const status = randomItem(AD_STATUSES)
    const startDate = randomDate(90)
    const endDate = new Date(startDate.getTime() + randomInt(7, 90) * 86400000)
    const now = new Date()
    const effectiveStatus = endDate < now ? "expired" : status

    adDocs.push({
      email,
      shopName,
      shopDescription,
      contactInfo: isUS
        ? `+1-${randomInt(200, 999)}-${randomInt(100, 999)}-${randomInt(1000, 9999)} | ${shopName.toLowerCase().replace(/\s+/g, "")}@gmail.com`
        : `+91-${randomInt(70000, 99999)}${randomInt(10000, 99999)} | ${shopName.toLowerCase().replace(/\s+/g, "")}@gmail.com`,
      images: [
        PLACEHOLDER_IMAGES[i % PLACEHOLDER_IMAGES.length],
        PLACEHOLDER_IMAGES[(i + 1) % PLACEHOLDER_IMAGES.length],
      ],
      adType,
      status: effectiveStatus,
      views: randomInt(50, 5000),
      clicks: randomInt(5, 300),
      startDate,
      endDate,
      paymentAmount: isUS ? randomItem([9.99, 19.99, 29.99, 49.99]) : randomItem([499, 999, 1499, 2999]),
      paymentCurrency: isUS ? "USD" : "INR",
      paymentId: `pay_${Math.random().toString(36).slice(2, 14).toUpperCase()}`,
      createdAt: startDate,
      updatedAt: new Date(),
    })
  }

  await db.collection("advertisements").insertMany(adDocs, { ordered: false })
  console.log(`  ✅ ${adDocs.length} advertisements inserted.`)

  // ── 3. Seed Marketplace Assets ───────────────────────────────────────────────

  console.log(`\n🛒 Seeding ${ASSETS_COUNT} marketplace assets...`)

  const creatorEmails = [
    ...usEmailsForAds.slice(0, 5),
    ...inEmailsForAds.slice(0, 5),
  ]

  const assetDocs = []
  for (let i = 0; i < ASSETS_COUNT; i++) {
    const isUS = i < ASSETS_COUNT / 2
    const creatorEmail = creatorEmails[i % creatorEmails.length]
    const assetType = ASSET_TYPES[i % ASSET_TYPES.length]
    const tags = ASSET_TAGS[i % ASSET_TAGS.length]
    const rating = randomFloat(3.5, 5.0, 1)
    const ratingCount = randomInt(10, 120)

    assetDocs.push({
      creatorEmail,
      type: assetType,
      title: ASSET_TITLES[i % ASSET_TITLES.length],
      description: `Premium ${assetType} design for car customization enthusiasts. Compatible with all major car makes and models. High-resolution, print-ready file included.`,
      thumbnailUrl: PLACEHOLDER_IMAGES[i % PLACEHOLDER_IMAGES.length],
      assetUrl: `https://storage.auto-vision-pro.com/assets/dummy-${i + 1}.zip`,
      premium: i % 3 !== 0, // 2/3 are premium
      priceIN: randomItem([199, 299, 499, 799, 999]),
      priceUS: randomItem([2.99, 4.99, 7.99, 9.99, 14.99]),
      commissionPct: 25,
      downloads: randomInt(5, 500),
      revenueIN: randomInt(500, 50000),
      revenueUS: randomFloat(20, 500, 2),
      rating,
      ratingCount,
      status: "approved",
      tags,
      createdAt: randomDate(120),
      updatedAt: new Date(),
    })
  }

  const assetResult = await db.collection("marketplace_assets").insertMany(assetDocs, { ordered: false })
  const insertedAssetIds = Object.values(assetResult.insertedIds)
  console.log(`  ✅ ${assetDocs.length} marketplace assets inserted.`)

  // ── 4. Seed Reviews ──────────────────────────────────────────────────────────

  const totalReviews = insertedAssetIds.length * REVIEWS_PER_ASSET
  console.log(`\n⭐ Seeding ${totalReviews} marketplace reviews...`)

  const allUserEmails = userDocs.map(u => u.email)
  const reviewDocs = []

  for (const assetId of insertedAssetIds) {
    for (let r = 0; r < REVIEWS_PER_ASSET; r++) {
      const reviewerEmail = allUserEmails[randomInt(0, allUserEmails.length - 1)]
      const reviewerUser = userDocs.find(u => u.email === reviewerEmail)
      const reviewerCountry = reviewerUser?.country ?? "US"

      // Weight ratings toward positive (4-5 stars)
      const ratingRoll = randomInt(1, 10)
      let rating, reviewText
      if (ratingRoll <= 6) {
        rating = 5
        reviewText = randomItem(REVIEW_TEXTS_POSITIVE)
      } else if (ratingRoll <= 8) {
        rating = 4
        reviewText = randomItem(REVIEW_TEXTS_POSITIVE)
      } else if (ratingRoll <= 9) {
        rating = 3
        reviewText = randomItem(REVIEW_TEXTS_NEUTRAL)
      } else {
        rating = randomItem([1, 2])
        reviewText = randomItem(REVIEW_TEXTS_NEGATIVE)
      }

      reviewDocs.push({
        assetId,
        reviewerEmail,
        reviewerCountry,
        rating,
        review: reviewText,
        helpful: randomInt(0, 20),
        verified: Math.random() > 0.3, // 70% verified purchases
        createdAt: randomDate(90),
      })
    }
  }

  // Insert reviews in batches
  let insertedReviews = 0
  for (let i = 0; i < reviewDocs.length; i += BATCH) {
    const batch = reviewDocs.slice(i, i + BATCH)
    const res = await db.collection("marketplace_reviews").insertMany(batch, { ordered: false })
    insertedReviews += Object.keys(res.insertedIds).length
    process.stdout.write(`\r  ✅ Inserted ${Math.min(i + BATCH, reviewDocs.length)}/${totalReviews} reviews`)
  }
  console.log(`\n  Done: ${insertedReviews} reviews inserted.`)

  // ── 5. Create indexes for reviews collection ──────────────────────────────────

  await db.collection("marketplace_reviews").createIndexes([
    { key: { assetId: 1, createdAt: -1 }, name: "reviews_asset_created" },
    { key: { reviewerEmail: 1 }, name: "reviews_reviewer" },
  ])

  // ── Summary ───────────────────────────────────────────────────────────────────

  console.log("\n" + "─".repeat(50))
  console.log("✅ Seed complete!")
  console.log(`   Users:       ${insertedUsers} (${US_COUNT} US + ${IN_COUNT} IN)`)
  console.log(`   Ads:         ${adDocs.length}`)
  console.log(`   Assets:      ${assetDocs.length}`)
  console.log(`   Reviews:     ${insertedReviews}`)
  console.log("\n   Email pattern: useruk07001@yopmail.com → useruk07${pad(TOTAL_USERS, 4)}@yopmail.com".replace("${pad(TOTAL_USERS, 4)}", pad(TOTAL_USERS, 4)))
  console.log(`   Password:    ${PASSWORD}`)
  console.log("─".repeat(50))

  await client.close()
}

main().catch((err) => {
  console.error("\n❌ Seed failed:", err)
  process.exit(1)
})
