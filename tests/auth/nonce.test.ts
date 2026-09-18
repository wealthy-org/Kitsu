import { describe, expect, it } from 'vitest'
import { InMemoryNonceStore, issueNonce, nonceExpiry, redeemNonce } from '@/lib/auth/nonce'

describe('nonce lifecycle', () => {
  it('issues and redeems a login nonce once', async () => {
    const store = new InMemoryNonceStore()
    const { nonce } = await issueNonce(store, '0xABC', 'login')
    const first = await redeemNonce(store, nonce, '0xabc', 'login')
    expect(first.status).toBe('ok')
    const second = await redeemNonce(store, nonce, '0xabc', 'login')
    expect(second.status).toBe('unknown')
  })

  it('rejects a nonce redeemed by a different wallet', async () => {
    const store = new InMemoryNonceStore()
    const { nonce } = await issueNonce(store, '0xabc', 'login')
    const result = await redeemNonce(store, nonce, '0xdef', 'login')
    expect(result.status).toBe('unknown')
  })

  it('rejects a nonce redeemed for a different purpose', async () => {
    const store = new InMemoryNonceStore()
    const { nonce } = await issueNonce(store, '0xabc', 'login')
    const result = await redeemNonce(store, nonce, '0xabc', 'submit')
    expect(result.status).toBe('unknown')
  })

  it('reports expired nonces', async () => {
    const store = new InMemoryNonceStore()
    await store.create({
      nonce: 'n1',
      walletAddress: '0xabc',
      purpose: 'login',
      expiresAt: new Date(Date.now() - 1000),
    })
    const result = await redeemNonce(store, 'n1', '0xabc', 'login')
    expect(result.status).toBe('expired')
  })

  it('expires nonces after five minutes by default', () => {
    const now = new Date('2026-09-18T00:00:00Z')
    expect(nonceExpiry(now).getTime() - now.getTime()).toBe(5 * 60 * 1000)
  })
})
