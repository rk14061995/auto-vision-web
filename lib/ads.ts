import type { Advertisement } from "@/lib/db"

const norm = (s?: string) => (s || "").trim().toLowerCase()

const isNational = (a: Advertisement) => {
  const c = norm(a.city)
  return !c || c === "all india"
}

// Regional clusters of Indian cities treated as "nearby" for ad targeting —
// a shop in one city still reaches customers likely to travel from its
// neighbors. Extend as advertisers from new regions are onboarded.
const CITY_CLUSTERS: string[][] = [
  ["Dehradun", "Rishikesh", "Haridwar", "Mussoorie", "Roorkee"],
  ["Delhi", "New Delhi", "Gurgaon", "Gurugram", "Noida", "Ghaziabad", "Faridabad"],
  ["Mumbai", "Thane", "Navi Mumbai", "Pune"],
  ["Bangalore", "Bengaluru"],
  ["Hyderabad", "Secunderabad"],
  ["Chennai"],
  ["Kolkata", "Howrah"],
  ["Ahmedabad", "Gandhinagar", "Surat"],
  ["Chandigarh", "Mohali", "Panchkula"],
  // Uttar Pradesh (Noida/Ghaziabad live in the Delhi-NCR cluster above instead)
  ["Lucknow", "Kanpur", "Agra", "Varanasi", "Meerut", "Prayagraj"],
  // Rajasthan
  ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Bikaner", "Bhilwara", "Beawar", "Degana"],
  // Bihar
  ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga", "Purnia", "Ara", "Chapra", "Hajipur", "Begusarai", "Motihari", "Samastipur"],
]

function nearbyCities(city: string): Set<string> {
  const n = norm(city)
  for (const cluster of CITY_CLUSTERS) {
    const normalized = cluster.map(norm)
    if (normalized.includes(n)) return new Set(normalized.filter((c) => c !== n))
  }
  return new Set()
}

// 0 = exact city match, 1 = nearby city (same regional cluster),
// 2 = national/untargeted, 3 = a different, unrelated city (last-resort fallback)
function tierOf(a: Advertisement, city: string | null, nearby: Set<string>): 0 | 1 | 2 | 3 {
  if (isNational(a)) return 2
  if (!city) return 3
  const adCity = norm(a.city)
  if (adCity === norm(city)) return 0
  if (nearby.has(adCity)) return 1
  return 3
}

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Ranks ads by relevance to the visitor's city: exact city match first, then
 * nearby cities in the same regional cluster, then national/untargeted ads,
 * then everything else — so local shop ads reach nearby customers first
 * without a placement ever sitting empty. Randomized within each tier.
 */
export function rankAdsByLocation(ads: Advertisement[], city: string | null): Advertisement[] {
  if (ads.length === 0) return []
  const nearby = city ? nearbyCities(city) : new Set<string>()
  return shuffled(ads)
    .map((a) => ({ a, tier: tierOf(a, city, nearby) }))
    .sort((x, y) => x.tier - y.tier)
    .map((x) => x.a)
}

/**
 * Ads from only the single best-available relevance tier — for single-slot
 * placements (e.g. the homepage hero) where the whole slot should go to the
 * most relevant advertiser rather than mixing in lower-relevance ones.
 */
export function selectAdsForCity(ads: Advertisement[], city: string | null): Advertisement[] {
  const ranked = rankAdsByLocation(ads, city)
  if (ranked.length === 0) return []
  const nearby = city ? nearbyCities(city) : new Set<string>()
  const bestTier = tierOf(ranked[0], city, nearby)
  return ranked.filter((a) => tierOf(a, city, nearby) === bestTier)
}
