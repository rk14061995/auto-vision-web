import { NextRequest } from "next/server"
import { runAiEndpoint } from "@/lib/ai-runner"
import { getProvider } from "@/lib/ai-providers"

export async function POST(request: NextRequest) {
  return runAiEndpoint<{ baseImageUrl: string; prompt: string; style?: string }, { url: string }>(
    request,
    {
      feature: "ai_wrap_generate",
      async parseInput(req) {
        const body = await req.json().catch(() => ({}))
        const { baseImageUrl, prompt, style } = body as Record<string, string>
        if (!baseImageUrl || !prompt) {
          throw new Error("baseImageUrl and prompt are required")
        }
        return { baseImageUrl, prompt, style }
      },
      async run(input) {
        const result = await getProvider().wrapGenerate(input)
        return { url: result.url, providerRequestId: result.providerRequestId }
      },
    },
  )
}
