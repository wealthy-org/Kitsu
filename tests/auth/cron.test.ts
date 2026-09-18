import { beforeEach, describe, expect, it } from 'vitest'
import { isCronAuthorized } from '@/lib/auth/cron'

function requestWith(header?: string): Request {
  const headers = header ? { authorization: header } : undefined
  return new Request('http://localhost/api/cron/publish-course', { method: 'POST', headers })
}

describe('cron authorization', () => {
  beforeEach(() => {
    process.env.CRON_SECRET = 'cron-secret-value'
  })

  it('accepts the exact bearer secret', () => {
    expect(isCronAuthorized(requestWith('Bearer cron-secret-value'))).toBe(true)
  })

  it('rejects a wrong secret', () => {
    expect(isCronAuthorized(requestWith('Bearer wrong-value'))).toBe(false)
  })

  it('rejects a missing header', () => {
    expect(isCronAuthorized(requestWith())).toBe(false)
  })

  it('rejects a non-bearer scheme', () => {
    expect(isCronAuthorized(requestWith('Basic cron-secret-value'))).toBe(false)
  })
})
