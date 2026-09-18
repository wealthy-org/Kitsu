import { NextResponse } from 'next/server'
import { z } from 'zod'
import { isSameOrigin } from '@/lib/auth/origin'
import { getSessionWallet } from '@/lib/auth/session'
import { DbSessionStore } from '@/lib/auth/session-store'
import { apiError } from '@/lib/http/error'
import { submitRun, type SubmitErrorCode } from '@/lib/services/run-submit.service'
import { inputEventSchema, inputLogByteSize } from '@/lib/validation/input-log'
import { MAX_INPUT_LOG_BYTES } from '@/sim/constants'

const bodySchema = z.object({
  daily_seed: z.string().min(1).max(64),
  input_log: z.array(inputEventSchema),
  claimed_time_ms: z.number().int().nonnegative(),
  claimed_score: z.number().nonnegative(),
  nonce: z.string().min(1).max(128),
  signature: z.string().min(1),
})

const ERROR_STATUS: Record<SubmitErrorCode, number> = {
  INVALID_RUN_SIGNATURE: 401,
  NONCE_EXPIRED: 401,
  NONCE_REUSED: 409,
  RATE_LIMITED: 429,
  RUN_NOT_COMPLETED: 422,
  RUN_REJECTED: 422,
}

const ERROR_MESSAGE: Record<SubmitErrorCode, string> = {
  INVALID_RUN_SIGNATURE: 'Run signature is invalid.',
  NONCE_EXPIRED: 'Nonce has expired.',
  NONCE_REUSED: 'Nonce is unknown or already used.',
  RATE_LIMITED: 'Daily submission limit reached.',
  RUN_NOT_COMPLETED: 'Run did not reach the finish.',
  RUN_REJECTED: 'Run was rejected during re-simulation.',
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return apiError(403, 'FORBIDDEN_ORIGIN', 'Request origin is not allowed.')
  }

  const wallet = await getSessionWallet(new DbSessionStore(), request)
  if (!wallet) {
    return apiError(401, 'UNAUTHENTICATED', 'No active session.')
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Request body must be valid JSON.')
  }

  const parsed = bodySchema.safeParse(payload)
  if (!parsed.success) {
    return apiError(400, 'VALIDATION_ERROR', 'Input shape or type is invalid.')
  }

  if (inputLogByteSize(parsed.data.input_log) > MAX_INPUT_LOG_BYTES) {
    return apiError(400, 'VALIDATION_ERROR', `input_log exceeds the ${MAX_INPUT_LOG_BYTES} byte limit.`)
  }

  const outcome = await submitRun({
    wallet,
    courseDate: parsed.data.daily_seed,
    inputLog: parsed.data.input_log,
    claimedTimeMs: parsed.data.claimed_time_ms,
    claimedScore: parsed.data.claimed_score,
    nonce: parsed.data.nonce,
    signature: parsed.data.signature,
  })

  if (!outcome.ok) {
    const response = apiError(
      ERROR_STATUS[outcome.code],
      outcome.code,
      ERROR_MESSAGE[outcome.code],
    )
    if (outcome.code === 'RATE_LIMITED') {
      response.headers.set('Retry-After', '86400')
    }
    return response
  }

  return NextResponse.json(
    {
      run_id: outcome.data.runId,
      status: outcome.data.status,
      verified_time_ms: outcome.data.verifiedTimeMs,
      verified_score: outcome.data.verifiedScore,
      is_best: outcome.data.isBest,
      rank: outcome.data.rank,
    },
    { status: 201 },
  )
}
