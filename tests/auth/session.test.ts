import { beforeEach, describe, expect, it } from 'vitest'
import { SESSION_COOKIE, getSessionWallet, signSession, verifySession } from '@/lib/auth/session'

beforeEach(() => {
  process.env.SESSION_SECRET = 'test-secret'
})

describe('session signing', () => {
  it('round-trips a signed session', () => {
    const token = signSession('0xabc')
    expect(verifySession(token)?.wallet).toBe('0xabc')
  })

  it('rejects a tampered token', () => {
    const token = signSession('0xabc')
    const lastChar = token.at(-1)
    const tampered = token.slice(0, -1) + (lastChar === 'A' ? 'B' : 'A')
    expect(verifySession(tampered)).toBeNull()
  })

  it('rejects an expired session', () => {
    const nineDaysAgo = Date.now() - 9 * 24 * 60 * 60 * 1000
    const token = signSession('0xabc', nineDaysAgo)
    expect(verifySession(token)).toBeNull()
  })

  it('reads the wallet from the cookie header', () => {
    const token = signSession('0xabc')
    const request = new Request('http://localhost/api/x', {
      headers: { cookie: `${SESSION_COOKIE}=${token}` },
    })
    expect(getSessionWallet(request)).toBe('0xabc')
  })
})
