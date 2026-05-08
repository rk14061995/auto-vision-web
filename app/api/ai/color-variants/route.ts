import { NextRequest } from "next/server"
import { runAiEndpoint } from "@/lib/ai-runner"
import { getProvider } from "@/lib/ai-providers"

export async function POST(request: NextRequest) {
  return runAiEndpoint<{ imageUrl: string; count?: number }, { urls: string[] }>(request, {
    feature: "ai_color_variants",
    async parseInput(req) {
      const body = await req.json().catch(() => ({}))
      const imageUrl = body?.imageUrl as string | undefined
      const count = typeof body?.count === "number" ? body.count : undefined
      if (!imageUrl) throw new Error("imageUrl is required")
      return { imageUrl, count }
    },
    async run(input) {
      const result = await getProvider().colorVariants(input)
      return { urls: result.urls, providerRequestId: result.providerRequestId }
    },
  })
}
