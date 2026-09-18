import { randomBytes } from 'node:crypto'

export type NoncePurpose = 'login' | 'submit'

export const NONCE_TTL_MS = 5 * 60 * 1000

export interface NonceRecord {
  nonce: string
  walletAddress: string
  purpose: NoncePurpose
  expiresAt: Date
}

export type ConsumeResult =
  | { status: 'ok'; record: NonceRecord }
  | { status: 'expired' }
  | { status: 'unknown' }

export interface NonceStore {
  create(record: NonceRecord): Promise<void>
  consume(nonce: string): Promise<ConsumeResult>
}

export function createNonce(): string {
  return randomBytes(16).toString('hex')
}

export function nonceExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + NONCE_TTL_MS)
}

export class InMemoryNonceStore implements NonceStore {
  private readonly records = new Map<string, NonceRecord>()

  async create(record: NonceRecord): Promise<void> {
    this.records.set(record.nonce, record)
  }

  async consume(nonce: string): Promise<ConsumeResult> {
    const record = this.records.get(nonce)
    if (!record) {
      return { status: 'unknown' }
    }
    this.records.delete(nonce)
    if (record.expiresAt.getTime() < Date.now()) {
      return { status: 'expired' }
    }
    return { status: 'ok', record }
  }
}

export async function issueNonce(
  store: NonceStore,
  walletAddress: string,
  purpose: NoncePurpose,
  now: Date = new Date(),
): Promise<{ nonce: string; expiresAt: Date }> {
  const nonce = createNonce()
  const expiresAt = nonceExpiry(now)
  await store.create({ nonce, walletAddress: walletAddress.toLowerCase(), purpose, expiresAt })
  return { nonce, expiresAt }
}

export async function redeemNonce(
  store: NonceStore,
  nonce: string,
  walletAddress: string,
  purpose: NoncePurpose,
): Promise<ConsumeResult> {
  const result = await store.consume(nonce)
  if (result.status !== 'ok') {
    return result
  }
  const matches =
    result.record.walletAddress === walletAddress.toLowerCase() &&
    result.record.purpose === purpose
  return matches ? result : { status: 'unknown' }
}
