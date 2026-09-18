import { timingSafeEqual } from 'node:crypto'

export function isCronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return false
  }
  const header = request.headers.get('authorization')
  if (!header) {
    return false
  }
  const prefix = 'Bearer '
  if (!header.startsWith(prefix)) {
    return false
  }
  const provided = Buffer.from(header.slice(prefix.length))
  const expected = Buffer.from(secret)
  if (provided.length !== expected.length) {
    return false
  }
  return timingSafeEqual(provided, expected)
}
