import "server-only"

import { NextRequest, NextResponse } from "next/server"
import { auth } from "./auth"
import { CREDIT_COSTS, type AICreditableFeature } from "./credit-packs"
import { debit, refund } from "./credits"
import type { Session } from "next-auth"
import { writeUsageEvent } from "./usage"

interface RunOptions<TInput, TOutput> {
  feature: AICreditableFeature
  parseInput: (request: NextRequest, session: Session) => Promise<TInput> | TInput
  run: (input: TInput) => Promise<TOutput & { providerRequestId: string }>
}

/**
 * Wraps an AI feature endpoint with auth, idempotent credit debit,
 * provider invocation, refund-on-error, and usage event logging.
 */
export async function runAiEndpoint<TInput, TOutput>(
  request: NextRequest,
  options: RunOptions<TInput, TOutput>,
): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const cost = CREDIT_COSTS[options.feature]
  const idempotencyKey =
    request.headers.get("x-idempotency-key") ??
    request.headers.get("idempotency-key") ??
    undefined

  let input: TInput
  try {
    input = await options.parseInput(request, session)
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || "Invalid input" },
      { status: 400 },
    )
  }

  const debitResult = await debit(session.user.email, {
    feature: options.feature,
    cost,
    idempotencyKey,
  })

  if (!debitResult.ok) {
    if (debitResult.reason === "insufficient") {
      return NextResponse.json(
        {
          error: "Insufficient AI credits",
          code: "insufficient_credits",
          required: cost,
          available: debitResult.available,
        },
        { status: 402 },
      )
    }
    if (debitResult.reason === "duplicate") {
      return NextResponse.json(
        {
          error: "Duplicate request",
          code: "duplicate",
          transactionId: debitResult.existingTransactionId,
        },
        { status: 409 },
      )
    }
    return NextResponse.json({ error: "Could not debit credits" }, { status: 500 })
  }

  try {
    const output = await options.run(input)
    await writeUsageEvent(session.user.email, "ai_call", {
      feature: options.feature,
      cost,
      providerRequestId: output.providerRequestId,
    })
    return NextResponse.json({
      success: true,
      transactionId: debitResult.transactionId,
      balanceAfter: debitResult.balanceAfter,
      ...output,
    })
  } catch (err) {
    console.error(`[ai/${options.feature}] failed:`, err)
    await refund(debitResult.transactionId, "provider_error")
    await writeUsageEvent(session.user.email, "ai_call_refunded", {
      feature: options.feature,
      cost,
      reason: "provider_error",
    })
    return NextResponse.json(
      {
        error: "AI provider failed",
        code: "provider_error",
        refunded: true,
      },
      { status: 502 },
    )
  }
}
