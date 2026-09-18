// @vitest-environment node
import { afterAll, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { auditLogs, runs } from '@/db/schema'
import { getDb } from '@/lib/db/client'
import { pruneAuditLogs } from '@/lib/repositories/audit.repository'
import { tombstoneOldInputLogs } from '@/lib/repositories/run.repository'

const hasDatabase = Boolean(process.env.DATABASE_URL)
const WALLET = '0xtest-retention'
const COURSE_DATE = '2099-01-02'
const OLD = new Date('2000-01-01T00:00:00Z')
const CUTOFF = new Date('2001-01-01T00:00:00Z')
const TIMEOUT = 20000

afterAll(async () => {
  if (hasDatabase) {
    const db = getDb()
    await db.delete(runs).where(eq(runs.walletAddress, WALLET))
    await db.delete(auditLogs).where(eq(auditLogs.actorWallet, WALLET))
  }
}, TIMEOUT)

describe.skipIf(!hasDatabase)('retention (database)', () => {
  it(
    'tombstones old input logs and prunes old audit logs',
    async () => {
      const db = getDb()
      await db.insert(runs).values({
        walletAddress: WALLET,
        courseDate: COURSE_DATE,
        inputLog: [{ tick: 1, action: 'jump' }],
        claimedScore: '0',
        claimedTimeMs: 1,
        status: 'verified',
        createdAt: OLD,
      })
      await db
        .insert(auditLogs)
        .values({ eventType: 'run.verified', actorWallet: WALLET, detail: {}, createdAt: OLD })

      const tombstoned = await tombstoneOldInputLogs(CUTOFF)
      const pruned = await pruneAuditLogs(CUTOFF)

      expect(tombstoned).toBeGreaterThanOrEqual(1)
      expect(pruned).toBeGreaterThanOrEqual(1)

      const [row] = await db.select().from(runs).where(eq(runs.walletAddress, WALLET))
      expect(row.inputLog).toEqual({})
    },
    TIMEOUT,
  )
})
