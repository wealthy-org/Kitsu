import { describe, expect, it } from 'vitest'
import {
  InMemorySessionStore,
  SESSION_COOKIE,
  createSessionToken,
  getSessionWallet,
  readSessionToken,
  resolveSessionWallet,
  sessionExpiry,
} from '@/lib/auth/session'

describe('server-side session', () => {
  it('creates and resolves a session', async () => {
    const store = new InMemorySessionStore()
    const token = createSessionToken()
    await store.create({ token, walletAddress: '0xabc', expiresAt: sessionExpiry() })
    await expect(resolveSessionWallet(store, token)).resolves.toBe('0xabc')
  })

  it('rejects an unknown token', async () => {
    const store = new InMemorySessionStore()
    await expect(resolveSessionWallet(store, 'unknown')).resolves.toBeNull()
  })

  it('rejects an expired session', async () => {
    const store = new InMemorySessionStore()
    await store.create({
      token: 'expired',
      walletAddress: '0xabc',
      expiresAt: new Date(Date.now() - 1000),
    })
    await expect(resolveSessionWallet(store, 'expired')).resolves.toBeNull()
  })

  it('reads the session token from the cookie header', () => {
    const request = new Request('http://localhost/x', {
      headers: { cookie: `${SESSION_COOKIE}=tok123` },
    })
    expect(readSessionToken(request)).toBe('tok123')
  })

  it('resolves the wallet from the request cookie', async () => {
    const store = new InMemorySessionStore()
    const token = createSessionToken()
    await store.create({ token, walletAddress: '0xabc', expiresAt: sessionExpiry() })
    const request = new Request('http://localhost/x', {
      headers: { cookie: `${SESSION_COOKIE}=${token}` },
    })
    await expect(getSessionWallet(store, request)).resolves.toBe('0xabc')
  })
})
