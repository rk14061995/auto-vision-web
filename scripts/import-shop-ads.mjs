/**
 * Bulk-import local car shops from every CSV in data_csv/ as active,
 * manually-onboarded banner advertisements (demo listings to show
 * prospective advertisers what their ad looks like on the platform).
 * Each row's own City column is used for location targeting, so shops from
 * different states/cities are imported side by side.
 *
 * Run from the project root:
 *   node scripts/import-shop-ads.mjs
 *
 * Safe to re-run — skips shops that were already imported (matched by
 * shopName + city + source: "manual"), so adding a new CSV to data_csv/
 * and re-running only imports the new file's rows.
 *
 * Reads MONGODB_URI from .env.local automatically.
 */

import { readFileSync, readdirSync } from "fs"
import { join, dirname, basename } from "path"
import { fileURLToPath } from "url"
import { MongoClient } from "mongodb"

const __dirname = dirname(fileURLToPath(import.meta.url))

// ─── Load .env.local ───────────────────────────────────────────────────────

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
      process.env[key] = value // last-wins, matching @next/env's handling of duplicate keys
    }
  } catch {
    // no .env.local — assume env vars are already set
  }
}

loadEnv(join(__dirname, "../.env.local"))

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error("MONGODB_URI not set — check .env.local")
  process.exit(1)
}

// ─── CSV parsing (handles quoted fields containing commas) ────────────────

function parseCsvLine(line) {
  const fields = []
  let cur = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++ }
      else if (c === '"') inQuotes = false
      else cur += c
    } else {
      if (c === '"') inQuotes = true
      else if (c === ",") { fields.push(cur); cur = "" }
      else cur += c
    }
  }
  fields.push(cur)
  return fields
}

// The source sheet isn't uniformly shaped — rows show up with 7 fields (the
// full header), 6 (missing the near-always-empty Website column), or 5
// (missing Website AND a separate City column, with the city folded into
// the Address text instead). Normalize all three by field count rather than
// trusting a fixed header index, or columns silently shift under each other.
function normalizeRow(fields) {
  const f = fields.map((v) => v.trim())
  if (f.length >= 7) {
    const [Name, Category, Website, Phone, Address, City, ...rest] = f
    return { Name, Category, Website, Phone, Address, City, MoreDetails: rest.join(", ").trim() }
  }
  if (f.length === 6) {
    const [Name, Category, Phone, Address, City, ...rest] = f
    return { Name, Category, Website: "", Phone, Address, City, MoreDetails: rest.join(", ").trim() }
  }
  if (f.length === 5) {
    const [Name, Category, Phone, Address, ...rest] = f
    return { Name, Category, Website: "", Phone, Address, City: "Dehradun", MoreDetails: rest.join(", ").trim() }
  }
  return null // unrecognized shape — surfaced as a warning by the caller
}

function parseCsv(content) {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0)
  return lines.slice(1).map((line, i) => {
    const row = normalizeRow(parseCsvLine(line))
    if (!row) console.warn(`  ! skipping row ${i + 2}: unrecognized column count — ${line}`)
    return row
  }).filter(Boolean)
}

// ─── Category mapping (CSV categories -> Advertisement.category enum) ─────
// Keyword-based since the sheet uses dozens of free-text category variants.

function mapCategory(csvCategory) {
  const c = csvCategory.toLowerCase()
  if (c.includes("tyre") || c.includes("alloy wheel")) return "tyre"
  if (c.includes("workshop") || c.includes("repair") || c.includes("service")) return "mechanic"
  if (c.includes("detailing") || c.includes("wash") || c.includes("ppf")) return "detailing"
  if (
    c.includes("accessories") || c.includes("decor") || c.includes("modification") ||
    c.includes("customization") || c.includes("interior") || c.includes("seat") ||
    c.includes("audio") || c.includes("part") || c.includes("glass")
  ) return "customization"
  return "other"
}

// ─── Placeholder banner image (self-contained SVG data URI — no external
// upload needed since the CSV has no photos). A clean gradient + initials
// monogram, matching the category colors used by the card UI — the shop
// name/category/phone render as real text in the card itself, so the image
// stays a visual accent rather than duplicating that text. ─────────────────

// Keep in sync with CATEGORY_STYLE in components/landing/shop-banner-strip.tsx
const CATEGORY_GRADIENTS = {
  customization: ["#6d28d9", "#a78bfa"],
  mechanic: ["#1d4ed8", "#60a5fa"],
  tyre: ["#b45309", "#fbbf24"],
  detailing: ["#0f766e", "#2dd4bf"],
  other: ["#334155", "#94a3b8"],
}

function initials(name) {
  const words = name.replace(/[^\p{L}\p{N}\s]/gu, "").split(/\s+/).filter(Boolean)
  return words.slice(0, 2).map((w) => w[0]?.toUpperCase() || "").join("") || "?"
}

function makeBannerSvg(shop, categoryKey) {
  const [c1, c2] = CATEGORY_GRADIENTS[categoryKey] || CATEGORY_GRADIENTS.other
  const mono = initials(shop.Name)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="800" height="450" fill="url(#bg)"/>
  <circle cx="140" cy="360" r="260" fill="#ffffff" opacity="0.07"/>
  <circle cx="700" cy="60" r="160" fill="#ffffff" opacity="0.07"/>
  <circle cx="400" cy="225" r="86" fill="#ffffff" opacity="0.18"/>
  <text x="400" y="250" font-family="Arial, sans-serif" font-size="68" font-weight="800" fill="#ffffff" text-anchor="middle">${mono}</text>
</svg>`
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`
}

// ─── Import ─────────────────────────────────────────────────────────────

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

async function main() {
  const dataDir = join(__dirname, "../data_csv")
  const csvFiles = readdirSync(dataDir).filter((f) => f.endsWith(".csv")).sort()
  if (csvFiles.length === 0) {
    console.error("No CSV files found in data_csv/")
    process.exit(1)
  }
  console.log(`Found ${csvFiles.length} CSV file(s): ${csvFiles.join(", ")}`)

  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  const db = client.db("saas-platform") // matches lib/db.ts getDb() — MONGODB_URI has no db path segment
  const collection = db.collection("advertisements")

  const now = new Date()
  const endDate = new Date(now)
  endDate.setDate(endDate.getDate() + 180) // 6-month demo listing

  let totalInserted = 0
  let totalSkipped = 0

  for (const file of csvFiles) {
    const region = basename(file, ".csv") // e.g. "dehradun.csv" -> "dehradun", used as a fallback city + email domain only
    const shops = parseCsv(readFileSync(join(dataDir, file), "utf-8"))
    console.log(`\n${file}: parsed ${shops.length} shops`)

    let inserted = 0
    let skipped = 0

    for (const shop of shops) {
      const shopName = shop.Name
      const city = shop.City || region

      const existing = await collection.findOne({ shopName, city, source: "manual" })
      if (existing) {
        skipped++
        continue
      }

      const category = mapCategory(shop.Category)
      const doc = {
        email: `${slugify(shopName)}@${slugify(city)}.local`,
        shopName,
        shopDescription: shop.MoreDetails || shop.Category,
        contactInfo: `${shop.Phone} — ${shop.Address}`,
        images: [makeBannerSvg(shop, category)],
        adType: "banner",
        status: "active",
        views: 0,
        clicks: 0,
        startDate: now,
        endDate,
        paymentAmount: 0,
        paymentCurrency: "INR",
        paymentId: "manual:demo-import",
        city,
        category,
        source: "manual",
        paymentMethod: "other",
        notes: `Imported from data_csv/${file} on ${now.toISOString().slice(0, 10)} — demo listing to show prospective advertisers, not yet paid. Address: ${shop.Address}`,
        createdAt: now,
        updatedAt: now,
      }

      await collection.insertOne(doc)
      inserted++
      console.log(`  + ${shopName} (${doc.category}, ${city})`)
    }

    console.log(`  ${file}: inserted ${inserted}, skipped ${skipped} already-imported.`)
    totalInserted += inserted
    totalSkipped += skipped
  }

  console.log(`\nDone. Inserted ${totalInserted}, skipped ${totalSkipped} already-imported across ${csvFiles.length} file(s).`)
  await client.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
