import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { auth } from "@/lib/auth"
import { debit } from "@/lib/credits"
import { writeUsageEvent } from "@/lib/usage"

const AI_COST = 2

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

    const { prompt, carMake, carModel, parts } = await request.json()
    if (!prompt) {
      return NextResponse.json({ error: "prompt required" }, { status: 400, headers })
    }

    const debitResult = await debit(session.user.email, {
      feature: "color_theme",
      cost: AI_COST,
      idempotencyKey: `color_theme:${session.user.email}:${Date.now()}`,
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

    const carContext = carMake && carModel ? `for a ${carMake} ${carModel}` : "for a car"
    const partList = Array.isArray(parts) && parts.length > 0
      ? parts.join(", ")
      : "Hood, Roof, Front Bumper, Rear Bumper, Door Left, Door Right, Trunk, Front Fender Left, Front Fender Right, Headlight Left, Headlight Right, Grille, Mirror Left, Mirror Right"

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      messages: [
        {
          role: "user",
          content: `You are an expert automotive designer and color specialist. Generate a complete color theme ${carContext}.

User's style request: "${prompt}"

Car parts to color: ${partList}

Return ONLY a valid JSON object with no markdown, no explanation:
{
  "themeName": "short catchy name (2-4 words)",
  "description": "one sentence describing the vibe",
  "colors": {
    "<part name>": "<hex color code>"
  },
  "accentColor": "<hex color used as accent/detail>",
  "mood": "one word (aggressive/elegant/playful/sporty/luxury/stealth)"
}

Rules:
- Every part in the list must have a color entry
- Use professional automotive color palettes — not just primary colors
- The theme must be cohesive — colors should complement each other
- Large panels (Hood, Doors, Roof, Fenders, Bumpers, Trunk) usually share a base color or close variants
- Lights, Grille, Mirrors can be contrasting/accent colors
- Return the JSON object only.`,
        },
      ],
    })

    const rawText = message.content[0].type === "text" ? message.content[0].text.trim() : "{}"
    let theme: Record<string, unknown>
    try {
      const cleaned = rawText.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim()
      theme = JSON.parse(cleaned)
    } catch {
      theme = { themeName: "Custom Theme", description: "AI-generated color scheme", colors: {}, mood: "custom" }
    }

    await writeUsageEvent(session.user.email, "ai_call", {
      feature: "color_theme",
      credits: AI_COST,
      prompt: prompt.slice(0, 100),
    })

    return NextResponse.json({ success: true, theme, creditsUsed: AI_COST }, { headers })
  } catch (err) {
    console.error("color-theme error:", err)
    return NextResponse.json({ error: "Color theme generation failed" }, { status: 500, headers })
  }
}
