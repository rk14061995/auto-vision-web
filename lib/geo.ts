export type Country = "IN" | "US"

export async function detectCountry(headers: Headers): Promise<Country> {
  // Vercel sets this header with the visitor's ISO country code.
  const vercelCountry = headers.get("x-vercel-ip-country")
  if (vercelCountry === "IN") return "IN"
  if (vercelCountry) return "US" // any non-IN country → USD pricing

  // No Vercel header means localhost / development — default to India.
  return "IN"
}

export function getCountryName(country: Country): string {
  return country === "IN" ? "India" : "United States"
}

export function getCurrencySymbol(country: Country): string {
  return country === "IN" ? "₹" : "$"
}

/**
 * Best-effort visitor city from Vercel's geo header — used to prioritize
 * city-targeted shop ads (e.g. a Pune tyre shop banner for Pune visitors).
 * Returns null on localhost/dev or when the header is absent (never throws).
 */
export function detectCity(headers: Headers): string | null {
  const raw = headers.get("x-vercel-ip-city")
  if (!raw) return null
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}
