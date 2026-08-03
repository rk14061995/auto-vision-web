// import NextAuth from "next-auth"
// import { authConfig } from "@/lib/auth.config"
// import { NextResponse, type NextRequest } from "next/server"
// import { type Region } from "@/lib/region"

// const { auth } = NextAuth(authConfig)

// // Reads Vercel's edge geo header — zero latency, no external fetch needed.
// // India → /in/ (INR + Razorpay)
// // Everyone else in production → /us/ (USD + PayPal, works globally)
// // No header (localhost dev) → /in/ so developers see Indian content by default
// function detectRegion(req: NextRequest): Region {
//   const country =
//     req.headers.get("x-vercel-ip-country") ??
//     (req as NextRequest & { geo?: { country?: string } }).geo?.country ??
//     null
//   if (country === "IN") return "in"
//   if (country === null) return "in"  // no header = localhost dev
//   return "us" // all other countries (US, UK, DE, AU, etc.) get USD pricing
// }

// export default auth((req) => {
//   const { pathname } = req.nextUrl

//   // ── Region override cookie (set via ?region=us or ?region=in) ─────────────
//   // Lets developers and admins preview the other region without a VPN.
//   const regionOverrideParam = req.nextUrl.searchParams.get("region")
//   if (regionOverrideParam === "us" || regionOverrideParam === "in") {
//     const res = NextResponse.redirect(
//       new URL(`/${regionOverrideParam}${pathname.startsWith("/us") || pathname.startsWith("/in") ? pathname.replace(/^\/(us|in)/, "") : pathname === "/" ? "" : pathname}`, req.url)
//     )
//     res.cookies.set("region_override", regionOverrideParam, {
//       path: "/",
//       httpOnly: true,
//       sameSite: "lax",
//       maxAge: 60 * 60 * 24, // 1 day
//     })
//     return res
//   }

//   // ── Read region override cookie ────────────────────────────────────────────
//   const regionCookie = req.cookies.get("region_override")?.value
//   const overriddenRegion: Region | null =
//     regionCookie === "us" || regionCookie === "in" ? regionCookie : null

//   function getEffectiveRegion(req: NextRequest): Region {
//     return overriddenRegion ?? detectRegion(req)
//   }

//   // ── Root → geo-redirect ────────────────────────────────────────────────────
//   if (pathname === "/") {
//     const region = getEffectiveRegion(req)
//     return NextResponse.redirect(new URL(`/${region}`, req.url))
//   }

//   // ── /pricing → geo-redirect ────────────────────────────────────────────────
//   if (pathname === "/pricing") {
//     const region = getEffectiveRegion(req)
//     return NextResponse.redirect(new URL(`/${region}/pricing`, req.url))
//   }

//   // ── Referral cookie ────────────────────────────────────────────────────────
//   const ref = req.nextUrl.searchParams.get("ref")
//   if (ref) {
//     const response = NextResponse.next()
//     response.cookies.set("ref", ref, {
//       path: "/",
//       httpOnly: true,
//       sameSite: "lax",
//       maxAge: 60 * 60 * 24 * 30,
//     })
//     return response
//   }

//   return NextResponse.next()
// })

// export const config = {
//   matcher: [
//     "/((?!_next/static|_next/image|favicon.ico|public|api).*)",
//   ],
// }

import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { NextResponse, type NextRequest } from "next/server"
import { type Region } from "@/lib/region"

const { auth } = NextAuth(authConfig)

// Detect search engine bots/crawlers
function isBot(req: NextRequest) {
  const userAgent = req.headers.get("user-agent") || ""

  return /bot|crawler|spider|google|bing|yahoo|duckduckbot|baidu|yandex/i.test(
    userAgent
  )
}

// Reads Vercel's edge geo header.
// India → /in
// UK → /uk
// Everyone else → /us
// No header (localhost) → /in
function detectRegion(req: NextRequest): Region {
  const country =
    req.headers.get("x-vercel-ip-country") ??
    (req as NextRequest & { geo?: { country?: string } }).geo?.country ??
    null

  if (country === "IN") return "in"
  if (country === "GB") return "uk"
  if (country === null) return "in"

  return "us"
}

export default auth((req) => {
  const { pathname } = req.nextUrl

  // ── Region override (?region=us / ?region=in / ?region=uk) ────────────────
  const regionOverrideParam = req.nextUrl.searchParams.get("region")

  if (
    regionOverrideParam === "us" ||
    regionOverrideParam === "in" ||
    regionOverrideParam === "uk"
  ) {
    const res = NextResponse.redirect(
      new URL(
        `/${regionOverrideParam}${
          pathname.startsWith("/us") || pathname.startsWith("/in") || pathname.startsWith("/uk")
            ? pathname.replace(/^\/(us|in|uk)/, "")
            : pathname === "/"
              ? ""
              : pathname
        }`,
        req.url
      )
    )

    res.cookies.set("region_override", regionOverrideParam, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
    })

    return res
  }

  // ── Read region override cookie ────────────────────────────────────────────
  const regionCookie = req.cookies.get("region_override")?.value

  const overriddenRegion: Region | null =
    regionCookie === "us" || regionCookie === "in" || regionCookie === "uk"
      ? regionCookie
      : null

  function getEffectiveRegion(req: NextRequest): Region {
    return overriddenRegion ?? detectRegion(req)
  }


  // ── Root geo redirect ──────────────────────────────────────────────────────
  // IMPORTANT:
  // Do not redirect Googlebot.
  // Allow Google to index /, /in and /us separately.
  if (pathname === "/" && !isBot(req)) {
    const region = getEffectiveRegion(req)

    return NextResponse.redirect(
      new URL(`/${region}`, req.url)
    )
  }


  // ── Pricing geo redirect ───────────────────────────────────────────────────
  if (pathname === "/pricing" && !isBot(req)) {
    const region = getEffectiveRegion(req)

    return NextResponse.redirect(
      new URL(`/${region}/pricing`, req.url)
    )
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