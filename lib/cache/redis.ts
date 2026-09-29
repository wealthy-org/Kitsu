import { Redis } from '@upstash/redis'

let client: Redis | null | undefined

// Credentials are optional by design: without them the app runs with the cache and limiter
// disabled, so every caller treats null as "Redis off" and falls back.
export function getRedis(): Redis | null {
  if (client !== undefined) {
    return client
  }
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  // Telemetry stays off; the project ships no third-party tracking.
  client = url && token ? new Redis({ url, token, enableTelemetry: false }) : null
  return client
}
