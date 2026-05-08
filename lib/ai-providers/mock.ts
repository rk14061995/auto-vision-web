// Deterministic mock AI provider. Returns synthetic URLs derived from input
// so the credit accounting flow can be smoke-tested end-to-end without
// external API keys or cost.

import crypto from "node:crypto"
import type {
  AIProvider,
  AIResult,
  AIMultiResult,
  BackgroundRemoveInput,
  ColorVariantsInput,
  EnhanceInput,
  WheelSuggestInput,
  WheelSuggestResult,
  WrapInput,
} from "./index"

function rid(prefix: string, ...parts: string[]): string {
  const hash = crypto
    .createHash("sha1")
    .update(parts.join("|"))
    .digest("hex")
    .slice(0, 12)
  return `${prefix}_${hash}`
}

function placeholderUrl(seed: string, label: string): string {
  // Cloudinary-compatible placeholder; in production this is replaced by a
  // real provider URL. Using a stable seed lets repeated calls return the
  // same URL during tests.
  return `https://placehold.co/1024x576/0f172a/ffffff?text=${encodeURIComponent(label)}-${seed.slice(0, 6)}`
}

export const mockProvider: AIProvider = {
  name: "mock",
  async wrapGenerate(input: WrapInput): Promise<AIResult> {
    const id = rid("mockwrap", input.baseImageUrl, input.prompt, input.style ?? "")
    return {
      url: placeholderUrl(id, "AI-Wrap"),
      providerRequestId: id,
    }
  },
  async backgroundRemove(input: BackgroundRemoveInput): Promise<AIResult> {
    const id = rid("mockbg", input.imageUrl)
    return {
      url: placeholderUrl(id, "BG-Removed"),
      providerRequestId: id,
    }
  },
  async colorVariants(input: ColorVariantsInput): Promise<AIMultiResult> {
    const id = rid("mockcv", input.imageUrl, String(input.count ?? 4))
    const count = Math.min(Math.max(input.count ?? 4, 1), 8)
    const urls = Array.from({ length: count }, (_, i) =>
      placeholderUrl(`${id}-${i}`, `Color-${i + 1}`),
    )
    return { urls, providerRequestId: id }
  },
  async wheelSuggest(input: WheelSuggestInput): Promise<WheelSuggestResult> {
    const id = rid("mockwheel", input.imageUrl, input.vehicleType ?? "")
    return {
      suggestions: [
        { name: "Forged Sport 19\"", thumbnailUrl: placeholderUrl(id + "-1", "Wheel-1"), score: 0.92 },
        { name: "Concave Mesh 20\"", thumbnailUrl: placeholderUrl(id + "-2", "Wheel-2"), score: 0.88 },
        { name: "Multi-Spoke 18\"", thumbnailUrl: placeholderUrl(id + "-3", "Wheel-3"), score: 0.81 },
      ],
      providerRequestId: id,
    }
  },
  async enhance(input: EnhanceInput): Promise<AIResult> {
    const id = rid("mockenh", input.imageUrl)
    return {
      url: placeholderUrl(id, "Enhanced"),
      providerRequestId: id,
    }
  },
}
