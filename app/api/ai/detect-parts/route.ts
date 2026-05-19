import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { auth } from "@/lib/auth"
import { debit } from "@/lib/credits"
import { writeUsageEvent } from "@/lib/usage"

const AI_COST = 3 // credits per detection run

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function corsHeaders(request: NextRequest) {
  const origin = request.headers.get("origin") || "*"
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Credentials": "true",
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) })
}

export async function POST(request: NextRequest) {
  const headers = corsHeaders(request)

  try {
    // Auth — NextAuth session or Bearer email fallback (for dashboard)
    let session = await auth()
    if (!session?.user?.email) {
      const authHeader = request.headers.get("authorization")
      if (authHeader?.startsWith("Bearer ")) {
        const email = authHeader.replace("Bearer ", "").trim()
        if (email) session = { user: { email } } as any
      }
    }
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers })
    }

    const { imageBase64, carMake, carModel } = await request.json()
    if (!imageBase64) {
      return NextResponse.json({ error: "imageBase64 required" }, { status: 400, headers })
    }

    // Debit credits before doing expensive work
    const debitResult = await debit(session.user.email, {
      feature: "detect_parts",
      cost: AI_COST,
      idempotencyKey: `detect_parts:${session.user.email}:${Date.now()}`,
    })
    if (!debitResult.ok) {
      const available = debitResult.available
        ? debitResult.available.monthly + debitResult.available.purchased
        : 0
      return NextResponse.json(
        { error: "Insufficient AI credits", creditsNeeded: AI_COST, balance: available },
        { status: 402, headers },
      )
    }

    // Strip data URI prefix if present
    const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "")

    const carContext = carMake && carModel ? `The car is a ${carMake} ${carModel}.` : ""

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: "image/png", data: base64Data },
            },
            {
              type: "text",
              text: `You are an expert automotive AI vision model. ${carContext}
Analyze this car image and identify all visible body panels and parts.

Return ONLY a valid JSON array with no markdown, no explanation. Each object must have:
- "name": string (part name, e.g. "Hood", "Front Bumper", "Door Left")
- "confidence": number 0-1
- "x": number (left edge as fraction of image width, 0-1)
- "y": number (top edge as fraction of image height, 0-1)
- "width": number (width as fraction of image width, 0-1)
- "height": number (height as fraction of image height, 0-1)
- "isSmallPart": boolean (true for lights, handles, mirrors, grille, emblems)

Identify parts including: Hood, Roof, Front Bumper, Rear Bumper, Door Left, Door Right, Trunk/Boot, Front Fender Left, Front Fender Right, Rear Fender Left, Rear Fender Right, Headlight Left, Headlight Right, Taillight Left, Taillight Right, Grille, Mirror Left, Mirror Right, Windshield, Rear Window.

Only include parts that are clearly visible. Return the JSON array only.`,
            },
          ],
        },
      ],
    })

    const rawText = message.content[0].type === "text" ? message.content[0].text.trim() : "[]"

    let parts: unknown[]
    try {
      // Claude sometimes wraps in ```json ... ``` — strip it
      const cleaned = rawText.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim()
      parts = JSON.parse(cleaned)
      if (!Array.isArray(parts)) throw new Error("Not an array")
    } catch {
      parts = []
    }

    await writeUsageEvent(session.user.email, "ai_call", {
      feature: "detect_parts",
      credits: AI_COST,
      partsFound: parts.length,
    })

    return NextResponse.json({ success: true, parts, creditsUsed: AI_COST }, { headers })
  } catch (err) {
    console.error("detect-parts error:", err)
    return NextResponse.json({ error: "Detection failed" }, { status: 500, headers })
  }
}
