import "server-only"
import { cookies } from "next/headers"

export type AdminCountry = "IN" | "US" | undefined

export async function getAdminCountry(): Promise<AdminCountry> {
  const store = await cookies()
  const val = store.get("admin-country")?.value
  return val === "IN" || val === "US" ? val : undefined
}

export function currencyForCountry(country: AdminCountry): "INR" | "USD" | undefined {
  if (country === "IN") return "INR"
  if (country === "US") return "USD"
  return undefined
}
