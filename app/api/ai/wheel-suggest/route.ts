import { NextRequest } from "next/server"
import { runAiEndpoint } from "@/lib/ai-runner"
import { getProvider } from "@/lib/ai-providers"

export async function POST(request: NextRequest) {
  return runAiEndpoint<
    { imageUrl: string; vehicleType?: string },
    { suggestions: { name: string; thumbnailUrl: string; score: number }[] }
  >(request, {
    feature: "ai_wheel_suggest",
    async parseInput(req) {
      const body = await req.json().catch(() => ({}))
      const imageUrl = body?.imageUrl as string | undefined
      const vehicleType = body?.vehicleType as string | undefined
      if (!imageUrl) throw new Error("imageUrl is required")
      return { imageUrl, vehicleType }
    },
    async run(input) {
      const result = await getProvider().wheelSuggest(input)
      return {
        suggestions: result.suggestions,
        providerRequestId: result.providerRequestId,
      }
    },
  })
}
