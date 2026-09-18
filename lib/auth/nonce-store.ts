import { eq } from 'drizzle-orm'
import { authNonces } from '@/db/schema'
import { getDb } from '@/lib/db/client'
import type { ConsumeResult, NoncePurpose, NonceRecord, NonceStore } from '@/lib/auth/nonce'

export class DbNonceStore implements NonceStore {
  async create(record: NonceRecord): Promise<void> {
    await getDb().insert(authNonces).values({
      nonce: record.nonce,
      walletAddress: record.walletAddress,
      purpose: record.purpose,
      expiresAt: record.expiresAt,
    })
  }

  async consume(nonce: string): Promise<ConsumeResult> {
    const db = getDb()
    const [row] = await db.delete(authNonces).where(eq(authNonces.nonce, nonce)).returning()
    if (!row) {
      return { status: 'unknown' }
    }
    if (row.expiresAt.getTime() < Date.now()) {
      return { status: 'expired' }
    }
    return {
      status: 'ok',
      record: {
        nonce: row.nonce,
        walletAddress: row.walletAddress,
        purpose: row.purpose as NoncePurpose,
        expiresAt: row.expiresAt,
      },
    }
  }
}
