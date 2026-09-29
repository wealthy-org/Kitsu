import type { Redis } from '@upstash/redis'
import { getRedis } from '@/lib/cache/redis'
import { countRunsForWalletDate } from '@/lib/repositories/run.repository'

export const MAX_DAILY_SUBMITS = 5
export const VERIFY_IP_LIMIT = 30
export const VERIFY_IP_KEY_PREFIX = 'kitsu:rl:verify:'
export const VERIFY_IP_WINDOW_SECONDS = 60

export interface VerifyIpLimitResult {
  allowed: boolean
  retryAfterSec: number
}

export async function countDailySubmissions(wallet: string, courseDate: string): Promise<number> {
  return countRunsForWalletDate(wallet, courseDate)
}

// Best-effort fixed window. Redis failures fail open so the public verify endpoint keeps working;
// the wallet-level submission limit remains the primary abuse control.
export async function consumeVerifyIpLimit(
  ip: string | null,
  client: Redis | null = getRedis(),
): Promise<VerifyIpLimitResult> {
  if (!ip || !client) {
    return { allowed: true, retryAfterSec: 0 }
  }

  const key = `${VERIFY_IP_KEY_PREFIX}${ip}`
  try {
    const count = await client.incr(key)
    if (count === 1) {
      await client.expire(key, VERIFY_IP_WINDOW_SECONDS)
    }
    if (count <= VERIFY_IP_LIMIT) {
      return { allowed: true, retryAfterSec: 0 }
    }

    const ttl = await client.ttl(key)
    if (ttl <= 0) {
      // Self-heal a counter whose expiry was lost between INCR and EXPIRE.
      await client.expire(key, VERIFY_IP_WINDOW_SECONDS)
      return { allowed: false, retryAfterSec: VERIFY_IP_WINDOW_SECONDS }
    }
    return { allowed: false, retryAfterSec: ttl }
  } catch (error) {
    console.warn(
      `verify ip rate limit unavailable: ${error instanceof Error ? error.message : 'unknown error'}`,
    )
    return { allowed: true, retryAfterSec: 0 }
  }
}
