import { eq } from 'drizzle-orm'
import { sessions } from '@/db/schema'
import { getDb } from '@/lib/db/client'
import type { SessionRecord, SessionStore } from '@/lib/auth/session'

export class DbSessionStore implements SessionStore {
  async create(record: SessionRecord): Promise<void> {
    await getDb().insert(sessions).values({
      token: record.token,
      walletAddress: record.walletAddress,
      expiresAt: record.expiresAt,
    })
  }

  async find(token: string): Promise<SessionRecord | null> {
    const [row] = await getDb()
      .select()
      .from(sessions)
      .where(eq(sessions.token, token))
      .limit(1)
    if (!row) {
      return null
    }
    return { token: row.token, walletAddress: row.walletAddress, expiresAt: row.expiresAt }
  }

  async delete(token: string): Promise<void> {
    await getDb().delete(sessions).where(eq(sessions.token, token))
  }
}
