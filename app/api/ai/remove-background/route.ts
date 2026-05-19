import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { debit } from "@/lib/credits"
import { writeUsageEvent } from "@/lib/usage"

const AI_COST = 2

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

    const apiKey = process.env.REMOVE_BG_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Background removal not configured" }, { status: 503, headers })
    }

    const { imageBase64 } = await request.json()
    if (!imageBase64) {
      return NextResponse.json({ error: "imageBase64 required" }, { status: 400, headers })
    }

    const debitResult = await debit(session.user.email, {
      feature: "background_remove",
      cost: AI_COST,
      idempotencyKey: `bg_remove:${session.user.email}:${Date.now()}`,
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

    // Convert base64 to binary for remove.bg
    const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "")
    const imageBuffer = Buffer.from(base64Data, "base64")

    const formData = new FormData()
    formData.append("image_file", new Blob([imageBuffer], { type: "image/png" }), "car.png")
    formData.append("size", "auto")

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": apiKey },
      body: formData,
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error("remove.bg error:", errText)
      return NextResponse.json({ error: "Background removal failed" }, { status: 502, headers })
    }

    const resultBuffer = await response.arrayBuffer()
    const resultBase64 = `data:image/png;base64,${Buffer.from(resultBuffer).toString("base64")}`

    await writeUsageEvent(session.user.email, "ai_call", {
      feature: "background_remove",
      credits: AI_COST,
    })

    return NextResponse.json({ success: true, resultBase64, creditsUsed: AI_COST }, { headers })
  } catch (err) {
    console.error("remove-background error:", err)
    return NextResponse.json({ error: "Background removal failed" }, { status: 500, headers })
  }
}
