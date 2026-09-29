import { NextResponse } from 'next/server'
import { apiError } from '@/lib/http/error'
import { consumeVerifyIpLimit } from '@/lib/services/rate-limit.service'
import { verifyRun } from '@/lib/services/run-verify.service'
import { inputLogByteSize, verifyRunSchema } from '@/lib/validation/input-log'
import { MAX_INPUT_LOG_BYTES } from '@/sim/constants'

// Vercel overwrites the forwarded headers at its edge (anti-spoofing), so the first value is the
// real client address; `x-vercel-forwarded-for` survives an extra proxy on top of Vercel.
function clientIp(request: Request): string | null {
  for (const header of ['x-vercel-forwarded-for', 'x-forwarded-for', 'x-real-ip']) {
    const value = request.headers.get(header)
    const first = value?.split(',')[0]?.trim()
    if (first) {
      return first
    }
  }
  return null
}

export async function POST(request: Request) {
  const limit = await consumeVerifyIpLimit(clientIp(request))
  if (!limit.allowed) {
    return apiError(429, 'RATE_LIMITED', 'Too many verification requests. Try again shortly.', {
      'Retry-After': String(limit.retryAfterSec),
    })
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Request body must be valid JSON.')
  }

  const parsed = verifyRunSchema.safeParse(payload)
  if (!parsed.success) {
    return apiError(400, 'VALIDATION_ERROR', 'Input shape or type is invalid.')
  }

  if (inputLogByteSize(parsed.data.input_log) > MAX_INPUT_LOG_BYTES) {
    return apiError(400, 'VALIDATION_ERROR', `input_log exceeds the ${MAX_INPUT_LOG_BYTES} byte limit.`)
  }

  const result = verifyRun(parsed.data.daily_seed, parsed.data.input_log)
  return NextResponse.json(result, { status: 200 })
}
