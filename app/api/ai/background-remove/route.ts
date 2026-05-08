import { NextRequest } from "next/server"
import { runAiEndpoint } from "@/lib/ai-runner"
import { getProvider } from "@/lib/ai-providers"

export async function POST(request: NextRequest) {
  return runAiEndpoint<{ imageUrl: string }, { url: string }>(request, {
    feature: "ai_background_remove",
    async parseInput(req) {
      const body = await req.json().catch(() => ({}))
      const { imageUrl } = body as Record<string, string>
      if (!imageUrl) throw new Error("imageUrl is required")
      return { imageUrl }
    },
    async run(input) {
      const result = await getProvider().backgroundRemove(input)
      return { url: result.url, providerRequestId: result.providerRequestId }
    },
  })
}
