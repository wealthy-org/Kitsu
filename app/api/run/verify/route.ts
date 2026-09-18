import { NextResponse } from 'next/server'
import { inputLogByteSize, verifyRunSchema } from '@/lib/validation/input-log'
import { verifyRun } from '@/lib/services/run-verify.service'
import { MAX_INPUT_LOG_BYTES } from '@/sim/constants'

function validationError(message: string) {
  return NextResponse.json(
    { error: { code: 'VALIDATION_ERROR', message, details: {} } },
    { status: 400 },
  )
}

export async function POST(request: Request) {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return validationError('Request body must be valid JSON.')
  }

  const parsed = verifyRunSchema.safeParse(payload)
  if (!parsed.success) {
    return validationError('Input shape or type is invalid.')
  }

  if (inputLogByteSize(parsed.data.input_log) > MAX_INPUT_LOG_BYTES) {
    return validationError(`input_log exceeds the ${MAX_INPUT_LOG_BYTES} byte limit.`)
  }

  const result = verifyRun(parsed.data.daily_seed, parsed.data.input_log)
  return NextResponse.json(result, { status: 200 })
}
