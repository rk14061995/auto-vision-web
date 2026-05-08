import { NextRequest, NextResponse } from "next/server"
import { processGracePeriod } from "@/lib/billing"

/**
 * Cron-friendly endpoint. Authenticated either by Vercel Cron header
 * (`x-vercel-cron`) or by a CRON_SECRET bearer token. Processes pending
 * downgrades whose grace period has elapsed and expires stale subscriptions.
 */
export async function POST(request: NextRequest) {
  const isVercelCron = request.headers.get("x-vercel-cron") === "1"
  const auth = request.headers.get("authorization") ?? ""
  const expected = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : null
  const isCronSecret = !!expected && auth === expected

  if (!isVercelCron && !isCronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await processGracePeriod()
    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    console.error("[cron/process-grace-period] failed:", err)
    return NextResponse.json({ error: "Cron failed" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  // GET allowed for ad-hoc admin runs.
  return POST(request)
}
