import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Redis } from '@upstash/redis'

const redisMock = vi.hoisted(() => ({
  incr: vi.fn(),
  expire: vi.fn(),
  ttl: vi.fn(),
}))

vi.mock('@/lib/cache/redis', () => ({
  getRedis: () => redisMock as unknown as Redis,
}))

import { POST } from '@/app/api/run/verify/route'

function makeRequest(ip?: string): Request {
  return new Request('http://localhost/api/run/verify', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(ip ? { 'x-forwarded-for': ip } : {}),
    },
    body: JSON.stringify({ daily_seed: '2026-09-18', input_log: [] }),
  })
}

describe('POST /api/run/verify per-IP limit', () => {
  beforeEach(() => {
    redisMock.incr.mockReset()
    redisMock.expire.mockReset().mockResolvedValue(1)
    redisMock.ttl.mockReset().mockResolvedValue(60)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('serves requests under the limit', async () => {
    redisMock.incr.mockResolvedValue(5)

    const response = await POST(makeRequest('203.0.113.7'))

    expect(response.status).toBe(200)
    expect(redisMock.incr).toHaveBeenCalledWith('kitsu:rl:verify:203.0.113.7')
  })

  it('returns 429 with Retry-After over the limit', async () => {
    redisMock.incr.mockResolvedValue(31)
    redisMock.ttl.mockResolvedValue(17)

    const response = await POST(makeRequest('203.0.113.7'))

    expect(response.status).toBe(429)
    expect(response.headers.get('retry-after')).toBe('17')
    const body = (await response.json()) as { error: { code: string } }
    expect(body.error.code).toBe('RATE_LIMITED')
  })

  it('skips the limiter when no IP header is present', async () => {
    const response = await POST(makeRequest())

    expect(response.status).toBe(200)
    expect(redisMock.incr).not.toHaveBeenCalled()
  })
})
