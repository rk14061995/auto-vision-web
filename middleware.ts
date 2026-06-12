import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { NextResponse, type NextRequest } from "next/server"
import { type Region } from "@/lib/region"

const { auth } = NextAuth(authConfig)

// Reads Vercel's edge geo header — zero latency, no external fetch needed.
// India → /in/ (INR + Razorpay)
// Everyone else in production → /us/ (USD + PayPal, works globally)
// No header (localhost dev) → /in/ so developers see Indian content by default
function detectRegion(req: NextRequest): Region {
  const country =
    req.headers.get("x-vercel-ip-country") ??
    (req as NextRequest & { geo?: { country?: string } }).geo?.country ??
    null
  if (country === "IN") return "in"
  if (country === null) return "in"  // no header = localhost dev
  return "us" // all other countries (US, UK, DE, AU, etc.) get USD pricing
}

// Regional paths that should be geo-locked (only /in/* and /us/* prefixes).
function getRegionFromPath(pathname: string): Region | null {
  if (pathname === "/in" || pathname.startsWith("/in/")) return "in"
  if (pathname === "/us" || pathname.startsWith("/us/")) return "us"
  return null
}

export default auth((req) => {
  const { pathname } = req.nextUrl

  // ── Region override cookie (set via ?region=us or ?region=in) ─────────────
  // Lets developers and admins preview the other region without a VPN.
  const regionOverrideParam = req.nextUrl.searchParams.get("region")
  if (regionOverrideParam === "us" || regionOverrideParam === "in") {
    const res = NextResponse.redirect(
      new URL(`/${regionOverrideParam}${pathname.startsWith("/us") || pathname.startsWith("/in") ? pathname.replace(/^\/(us|in)/, "") : pathname === "/" ? "/" : pathname}`, req.url)
    )
    res.cookies.set("region_override", regionOverrideParam, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 1 day
    })
    return res
  }

  // ── Read region override cookie ────────────────────────────────────────────
  const regionCookie = req.cookies.get("region_override")?.value
  const overriddenRegion: Region | null =
    regionCookie === "us" || regionCookie === "in" ? regionCookie : null

  function getEffectiveRegion(req: NextRequest): Region {
    return overriddenRegion ?? detectRegion(req)
  }

  // ── Root → geo-redirect ────────────────────────────────────────────────────
  if (pathname === "/") {
    const region = getEffectiveRegion(req)
    return NextResponse.redirect(new URL(`/${region}/`, req.url))
  }

  // ── /pricing → geo-redirect ────────────────────────────────────────────────
  if (pathname === "/pricing") {
    const region = getEffectiveRegion(req)
    return NextResponse.redirect(new URL(`/${region}/pricing`, req.url))
  }

  // ── Geo-lock regional pages ────────────────────────────────────────────────
  // If a visitor lands on the wrong region's page, redirect them to their own.
  // e.g. a US visitor on /in/pricing → /us/pricing
  const pathRegion = getRegionFromPath(pathname)
  if (pathRegion !== null) {
    const visitorRegion = getEffectiveRegion(req)
    if (pathRegion !== visitorRegion) {
      const corrected = pathname.replace(
        new RegExp(`^/${pathRegion}`),
        `/${visitorRegion}`
      )
      return NextResponse.redirect(new URL(corrected, req.url))
    }
  }

  // ── Referral cookie ────────────────────────────────────────────────────────
  const ref = req.nextUrl.searchParams.get("ref")
  if (ref) {
    const response = NextResponse.next()
    response.cookies.set("ref", ref, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    })
    return response
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public|api).*)",
  ],
}
