export type Country = "IN" | "US"

export async function detectCountry(headers: Headers): Promise<Country> {
  // First try Vercel's geolocation header
  const vercelCountry = headers.get("x-vercel-ip-country")
  if (vercelCountry === "IN") return "IN"
  if (vercelCountry) return "US"
  
  // Fallback: try to detect via IP
  try {
    const ip = headers.get("x-forwarded-for")?.split(",")[0] || headers.get("x-real-ip")
    if (ip && ip !== "::1" && ip !== "127.0.0.1") {
      const response = await fetch(`https://ipapi.co/${ip}/country/`, {
        next: { revalidate: 3600 }, // Cache for 1 hour
      })
      if (response.ok) {
        const country = await response.text()
        return country === "IN" ? "IN" : "US"
      }
    }
  } catch {
    // Silently fail and default to India
  }
  
  return "IN" // Default
}

export function getCountryName(country: Country): string {
  return country === "IN" ? "India" : "United States"
}

export function getCurrencySymbol(country: Country): string {
  return country === "IN" ? "₹" : "$"
}
