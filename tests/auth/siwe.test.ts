import { describe, expect, it } from 'vitest'
import { SiweMessage } from 'siwe'
import { privateKeyToAccount } from 'viem/accounts'
import { parseSiweNonce, verifySiweMessage } from '@/lib/auth/siwe'

const account = privateKeyToAccount(
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
)

async function signedMessage(nonce: string) {
  const message = new SiweMessage({
    domain: 'localhost:3000',
    address: account.address,
    statement: 'Sign in to Kitsu',
    uri: 'http://localhost:3000',
    version: '1',
    chainId: 46630,
    nonce,
  })
  const prepared = message.prepareMessage()
  const signature = await account.signMessage({ message: prepared })
  return { message: prepared, signature }
}

describe('SIWE verification', () => {
  it('verifies a valid signature and reads the nonce', async () => {
    const { message, signature } = await signedMessage('abcdef0123456789')
    expect(parseSiweNonce(message)).toBe('abcdef0123456789')
    const result = await verifySiweMessage({ message, signature, nonce: 'abcdef0123456789' })
    expect(result?.address.toLowerCase()).toBe(account.address.toLowerCase())
  })

  it('rejects a mismatched nonce', async () => {
    const { message, signature } = await signedMessage('abcdef0123456789')
    const result = await verifySiweMessage({ message, signature, nonce: 'ffffffffffffffff' })
    expect(result).toBeNull()
  })

  it('rejects a tampered message', async () => {
    const { message, signature } = await signedMessage('abcdef0123456789')
    const tampered = message.replace('Sign in to Kitsu', 'Sign in to Attacker')
    const result = await verifySiweMessage({
      message: tampered,
      signature,
      nonce: 'abcdef0123456789',
    })
    expect(result).toBeNull()
  })
})
