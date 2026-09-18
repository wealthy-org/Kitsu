import { describe, expect, it } from 'vitest'
import { privateKeyToAccount } from 'viem/accounts'
import { buildRunNonceMessage, verifyRunNonceSignature } from '@/lib/auth/run-nonce'

const account = privateKeyToAccount(
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
)

describe('run nonce signature', () => {
  it('accepts a signature from the session wallet', async () => {
    const nonce = 'run-nonce-123'
    const signature = await account.signMessage({
      message: buildRunNonceMessage(account.address, nonce),
    })
    await expect(verifyRunNonceSignature(account.address, nonce, signature)).resolves.toBe(true)
  })

  it('rejects a reused nonce in a different message', async () => {
    const nonce = 'run-nonce-123'
    const signature = await account.signMessage({
      message: buildRunNonceMessage(account.address, nonce),
    })
    await expect(verifyRunNonceSignature(account.address, 'other-nonce', signature)).resolves.toBe(
      false,
    )
  })

  it('rejects a signature from a different wallet', async () => {
    const other = privateKeyToAccount(
      '0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba',
    )
    const nonce = 'run-nonce-123'
    const signature = await other.signMessage({
      message: buildRunNonceMessage(account.address, nonce),
    })
    await expect(verifyRunNonceSignature(account.address, nonce, signature)).resolves.toBe(false)
  })
})
