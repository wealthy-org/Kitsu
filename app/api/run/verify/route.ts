import { NextResponse } from 'next/server'
import { apiError } from '@/lib/http/error'
import { inputLogByteSize, verifyRunSchema } from '@/lib/validation/input-log'
import { verifyRun } from '@/lib/services/run-verify.service'
import { MAX_INPUT_LOG_BYTES } from '@/sim/constants'

export async function POST(request: Request) {
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
