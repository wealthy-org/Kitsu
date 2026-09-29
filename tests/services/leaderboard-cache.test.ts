import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Redis } from '@upstash/redis'
import {
  DAILY_CACHE_KEY_PREFIX,
  DAILY_CACHE_TTL_SECONDS,
  invalidateDailyCache,
  readDailyCache,
  writeDailyCache,
} from '@/lib/cache/leaderboard-cache'

interface FakeHandlers {
  get?: (key: string) => unknown
  set?: (key: string, value: unknown, options: unknown) => unknown
  del?: (key: string) => unknown
}

function makeClient(handlers: FakeHandlers): Redis {
  return {
    get: vi.fn(handlers.get ?? (() => null)),
    set: vi.fn(handlers.set ?? (() => 'OK')),
    del: vi.fn(handlers.del ?? (() => 1)),
  } as unknown as Redis
}

const ENTRY = { wallet_address: '0xabc', best_time_ms: 42118, best_score: 700 }

describe('daily leaderboard cache', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('reads a valid cached board for the date key', async () => {
    const client = makeClient({ get: () => [ENTRY] })

    const result = await readDailyCache('2026-09-28', client)

    expect(result).toEqual([ENTRY])
    expect(client.get).toHaveBeenCalledWith(`${DAILY_CACHE_KEY_PREFIX}2026-09-28`)
  })

  it('treats a malformed payload as a miss', async () => {
    const malformed = makeClient({ get: () => [{ wallet_address: '0xabc', best_time_ms: 'fast' }] })
    const notAnArray = makeClient({ get: () => ({ wallet_address: '0xabc' }) })

    expect(await readDailyCache('2026-09-28', malformed)).toBeNull()
    expect(await readDailyCache('2026-09-28', notAnArray)).toBeNull()
  })

  it('returns a miss when Redis errors', async () => {
    const client = makeClient({
      get: () => {
        throw new Error('timeout')
      },
    })

    expect(await readDailyCache('2026-09-28', client)).toBeNull()
  })

  it('writes entries with a 60 second expiry', async () => {
    const client = makeClient({})

    await writeDailyCache('2026-09-28', [ENTRY], client)

    expect(client.set).toHaveBeenCalledWith(`${DAILY_CACHE_KEY_PREFIX}2026-09-28`, [ENTRY], {
      ex: DAILY_CACHE_TTL_SECONDS,
    })
  })

  it('invalidates only the requested date and swallows errors', async () => {
    const client = makeClient({})
    await invalidateDailyCache('2026-09-28', client)
    expect(client.del).toHaveBeenCalledWith(`${DAILY_CACHE_KEY_PREFIX}2026-09-28`)

    const failing = makeClient({
      del: () => {
        throw new Error('timeout')
      },
    })
    await expect(invalidateDailyCache('2026-09-28', failing)).resolves.toBeUndefined()
  })

  it('is a no-op without a Redis client', async () => {
    expect(await readDailyCache('2026-09-28', null)).toBeNull()
    await expect(writeDailyCache('2026-09-28', [ENTRY], null)).resolves.toBeUndefined()
    await expect(invalidateDailyCache('2026-09-28', null)).resolves.toBeUndefined()
  })
})

describe('getRedis', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('returns null when credentials are missing or empty', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '')
    const { getRedis } = await import('@/lib/cache/redis')

    expect(getRedis()).toBeNull()
  })

  it('returns a client when both credentials are set', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://example.upstash.io')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'test-token')
    const { getRedis } = await import('@/lib/cache/redis')

    expect(getRedis()).not.toBeNull()
  })
})
