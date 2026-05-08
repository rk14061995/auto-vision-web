// AI provider interface. The default mock provider returns deterministic
// placeholder URLs so the credit ledger and route logic can be exercised
// without external API keys. Real providers (OpenAI Images, Replicate,
// remove.bg) can be plugged in by swapping the export of getProvider().

import { mockProvider } from "./mock"

export interface WrapInput {
  baseImageUrl: string
  prompt: string
  style?: string
}

export interface BackgroundRemoveInput {
  imageUrl: string
}

export interface ColorVariantsInput {
  imageUrl: string
  count?: number
}

export interface WheelSuggestInput {
  imageUrl: string
  vehicleType?: string
}

export interface EnhanceInput {
  imageUrl: string
}

export interface AIResult {
  url: string
  providerRequestId: string
}

export interface AIMultiResult {
  urls: string[]
  providerRequestId: string
}

export interface WheelSuggestResult {
  suggestions: { name: string; thumbnailUrl: string; score: number }[]
  providerRequestId: string
}

export interface AIProvider {
  readonly name: string
  wrapGenerate(input: WrapInput): Promise<AIResult>
  backgroundRemove(input: BackgroundRemoveInput): Promise<AIResult>
  colorVariants(input: ColorVariantsInput): Promise<AIMultiResult>
  wheelSuggest(input: WheelSuggestInput): Promise<WheelSuggestResult>
  enhance(input: EnhanceInput): Promise<AIResult>
}

let cachedProvider: AIProvider | null = null

export function getProvider(): AIProvider {
  if (cachedProvider) return cachedProvider

  // Provider selection is intentionally environment-driven so a future
  // adapter (replicate / openai / remove-bg) can be enabled without code
  // changes. For now only the mock is wired.
  if (process.env.AI_PROVIDER === "replicate" && process.env.REPLICATE_API_TOKEN) {
    // TODO: import("./replicate").replicateProvider once implemented
    cachedProvider = mockProvider
  } else if (process.env.AI_PROVIDER === "openai" && process.env.OPENAI_API_KEY) {
    // TODO: import("./openai").openAiProvider once implemented
    cachedProvider = mockProvider
  } else {
    cachedProvider = mockProvider
  }

  return cachedProvider
}
