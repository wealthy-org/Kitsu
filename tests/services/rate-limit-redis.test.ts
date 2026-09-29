import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Redis } from '@upstash/redis'
import {
  VERIFY_IP_KEY_PREFIX,
  VERIFY_IP_LIMIT,
  VERIFY_IP_WINDOW_SECONDS,
  consumeVerifyIpLimit,
} from '@/lib/services/rate-limit.service'

interface FakeHandlers {
  incr: (key: string) => number | Promise<number>
  expire?: (key: string, seconds: number) => unknown
  ttl?: (key: string) => number | Promise<number>
}

function makeClient(handlers: FakeHandlers): Redis {
  return {
    incr: vi.fn(handlers.incr),
    expire: vi.fn(handlers.expire ?? (() => 1)),
    ttl: vi.fn(handlers.ttl ?? (() => VERIFY_IP_WINDOW_SECONDS)),
  } as unknown as Redis
}

describe('consumeVerifyIpLimit', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('allows requests under the limit and sets the window on the first hit', async () => {
    const client = makeClient({ incr: () => 1 })

    const result = await consumeVerifyIpLimit('203.0.113.7', client)

    expect(result).toEqual({ allowed: true, retryAfterSec: 0 })
    expect(client.incr).toHaveBeenCalledWith(`${VERIFY_IP_KEY_PREFIX}203.0.113.7`)
    expect(client.expire).toHaveBeenCalledWith(`${VERIFY_IP_KEY_PREFIX}203.0.113.7`, VERIFY_IP_WINDOW_SECONDS)
  })

  it('denies the request over the limit with the remaining window as Retry-After', async () => {
    const client = makeClient({ incr: () => VERIFY_IP_LIMIT + 1, ttl: () => 42 })

    const result = await consumeVerifyIpLimit('203.0.113.7', client)

    expect(result).toEqual({ allowed: false, retryAfterSec: 42 })
  })

  it('self-heals a counter that lost its expiry', async () => {
    const client = makeClient({ incr: () => VERIFY_IP_LIMIT + 1, ttl: () => -1 })

    const result = await consumeVerifyIpLimit('203.0.113.7', client)

    expect(result).toEqual({ allowed: false, retryAfterSec: VERIFY_IP_WINDOW_SECONDS })
    expect(client.expire).toHaveBeenCalledWith(`${VERIFY_IP_KEY_PREFIX}203.0.113.7`, VERIFY_IP_WINDOW_SECONDS)
  })

  it('fails open when Redis errors', async () => {
    const client = makeClient({
      incr: () => {
        throw new Error('connection refused')
      },
    })

    const result = await consumeVerifyIpLimit('203.0.113.7', client)

    expect(result).toEqual({ allowed: true, retryAfterSec: 0 })
  })

  it('skips the limiter without an IP or a Redis client', async () => {
    const client = makeClient({ incr: () => 1 })

    expect(await consumeVerifyIpLimit(null, client)).toEqual({ allowed: true, retryAfterSec: 0 })
    expect(await consumeVerifyIpLimit('203.0.113.7', null)).toEqual({ allowed: true, retryAfterSec: 0 })
    expect(client.incr).not.toHaveBeenCalled()
  })
})
