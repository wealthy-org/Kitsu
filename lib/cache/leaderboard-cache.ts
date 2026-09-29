import type { Redis } from '@upstash/redis'
import { getRedis } from '@/lib/cache/redis'

export const DAILY_CACHE_KEY_PREFIX = 'kitsu:lb:daily:'
export const DAILY_CACHE_TTL_SECONDS = 60

export interface CachedDailyEntry {
  wallet_address: string
  best_time_ms: number
  best_score: number
}

function cacheKey(courseDate: string): string {
  return `${DAILY_CACHE_KEY_PREFIX}${courseDate}`
}

function isCachedDailyEntry(value: unknown): value is CachedDailyEntry {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const entry = value as Record<string, unknown>
  return (
    typeof entry.wallet_address === 'string' &&
    typeof entry.best_time_ms === 'number' &&
    typeof entry.best_score === 'number'
  )
}

// A malformed payload is treated as a miss so a bad write can never poison the board.
export async function readDailyCache(
  courseDate: string,
  client: Redis | null = getRedis(),
): Promise<CachedDailyEntry[] | null> {
  if (!client) {
    return null
  }
  try {
    const cached = await client.get<unknown>(cacheKey(courseDate))
    if (!Array.isArray(cached)) {
      return null
    }
    const entries = cached.filter(isCachedDailyEntry)
    return entries.length === cached.length ? entries : null
  } catch (error) {
    console.warn(
      `daily leaderboard cache read unavailable: ${error instanceof Error ? error.message : 'unknown error'}`,
    )
    return null
  }
}

export async function writeDailyCache(
  courseDate: string,
  entries: CachedDailyEntry[],
  client: Redis | null = getRedis(),
): Promise<void> {
  if (!client) {
    return
  }
  try {
    await client.set(cacheKey(courseDate), entries, { ex: DAILY_CACHE_TTL_SECONDS })
  } catch (error) {
    console.warn(
      `daily leaderboard cache write unavailable: ${error instanceof Error ? error.message : 'unknown error'}`,
    )
  }
}

export async function invalidateDailyCache(
  courseDate: string,
  client: Redis | null = getRedis(),
): Promise<void> {
  if (!client) {
    return
  }
  try {
    await client.del(cacheKey(courseDate))
  } catch (error) {
    console.warn(
      `daily leaderboard cache invalidation unavailable: ${error instanceof Error ? error.message : 'unknown error'}`,
    )
  }
}
