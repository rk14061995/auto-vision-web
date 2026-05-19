import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { NextResponse, type NextRequest } from "next/server"
import { isValidRegion, type Region } from "@/lib/region"

const { auth } = NextAuth(authConfig)

// Reads Vercel's edge geo header — zero latency, no external fetch needed.
function detectRegion(req: NextRequest): Region {
  const country =
    req.headers.get("x-vercel-ip-country") ??
    (req as NextRequest & { geo?: { country?: string } }).geo?.country ??
    ""
  return country === "IN" ? "in" : "us"
}

export default auth((req) => {
  const { pathname } = req.nextUrl

  // ── Geo redirects ──────────────────────────────────────────────────────────
  // Redirect / → /in/ or /us/ based on visitor's country.
  if (pathname === "/") {
    const region = detectRegion(req)
    return NextResponse.redirect(new URL(`/${region}/`, req.url))
  }

  // Redirect /pricing → /in/pricing or /us/pricing.
  if (pathname === "/pricing") {
    const region = detectRegion(req)
    return NextResponse.redirect(new URL(`/${region}/pricing`, req.url))
  }

  // Guard: reject unknown [region] segments early (e.g. /fr/, /de/).
  const regionMatch = pathname.match(/^\/([^/]+)/)
  if (regionMatch && !isValidRegion(regionMatch[1])) {
    // Only intercept paths that look like a region prefix but aren't valid routes.
    // Let Next.js 404 handle it naturally — just fall through.
  }

  // ── Referral cookie (existing logic) ──────────────────────────────────────
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
