import { describe, expect, it } from 'vitest'
import { POST } from '@/app/api/run/verify/route'

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/run/verify', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

interface VerifyBody {
  verified: boolean
  completed: boolean
  time_ms: number | null
  coins_collected: number
  score: number
}

interface ErrorBody {
  error: { code: string; message: string }
}

describe('POST /api/run/verify', () => {
  it('returns 200 with verified false for an empty log', async () => {
    const response = await POST(makeRequest({ daily_seed: '2026-09-18', input_log: [] }))
    expect(response.status).toBe(200)
    const body = (await response.json()) as VerifyBody
    expect(body.verified).toBe(false)
    expect(body.time_ms).toBeNull()
  })

  it('returns 400 for malformed JSON', async () => {
    const response = await POST(makeRequest('{not json'))
    expect(response.status).toBe(400)
    const body = (await response.json()) as ErrorBody
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 for an invalid shape', async () => {
    const response = await POST(
      makeRequest({ daily_seed: 1, input_log: [{ tick: -1, action: 'fly' }] }),
    )
    expect(response.status).toBe(400)
  })

  it('returns 400 when input_log exceeds the byte limit', async () => {
    const oversized = Array.from({ length: 40000 }, (_, index) => ({
      tick: index,
      action: 'jump',
    }))
    const response = await POST(
      makeRequest({ daily_seed: '2026-09-18', input_log: oversized }),
    )
    expect(response.status).toBe(400)
    const body = (await response.json()) as ErrorBody
    expect(body.error.message).toContain('byte limit')
  })
})
