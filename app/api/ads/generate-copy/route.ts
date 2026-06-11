import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { auth } from "@/lib/auth"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { shopName, tagline, shopDescription, adType, brandColors } = await request.json()

  if (!shopName || !shopDescription || !adType) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const colorHint = brandColors?.length ? `Brand colors: ${brandColors.join(", ")}.` : ""

  const prompt = `You are an expert automotive advertising copywriter. Generate 3 distinct ad copy variants for an automotive business.

Business details:
- Shop name: ${shopName}
- Tagline: ${tagline || "none provided"}
- Description: ${shopDescription}
- Ad format: ${adType.replace(/_/g, " ")}
${colorHint}

Return ONLY a JSON array with exactly 3 objects. Each object must have these keys:
- "headline": 4-8 words, punchy and memorable
- "subtext": 10-18 words, describes the value proposition
- "cta": 2-4 words, action-oriented call to action

Example format:
[
  { "headline": "...", "subtext": "...", "cta": "..." },
  { "headline": "...", "subtext": "...", "cta": "..." },
  { "headline": "...", "subtext": "...", "cta": "..." }
]

Make each variant distinct in tone: one confident/bold, one friendly/approachable, one premium/aspirational.`

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    })

    const text = message.content[0].type === "text" ? message.content[0].text : ""
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error("No JSON array in response")

    const variants = JSON.parse(jsonMatch[0])
    if (!Array.isArray(variants) || variants.length < 1) throw new Error("Invalid variants")

    return NextResponse.json({ variants: variants.slice(0, 3) })
  } catch (err) {
    console.error("Copy generation error:", err)
    return NextResponse.json({ error: "Failed to generate copy" }, { status: 500 })
  }
}
