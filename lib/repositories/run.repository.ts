import { and, asc, desc, eq, lt, sql } from 'drizzle-orm'
import { runs } from '@/db/schema'
import { getDb } from '@/lib/db/client'
import type { InputLog } from '@/sim/types'

export interface InsertRunValues {
  walletAddress: string
  courseDate: string
  inputLog: InputLog
  claimedScore: number
  claimedTimeMs: number
  verifiedScore: number | null
  verifiedTimeMs: number | null
  status: 'submitted' | 'verified' | 'rejected' | 'relayed'
}

export async function countRunsForWalletDate(wallet: string, courseDate: string): Promise<number> {
  const db = getDb()
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(runs)
    .where(and(eq(runs.walletAddress, wallet), eq(runs.courseDate, courseDate)))
  return row?.count ?? 0
}

export async function insertRun(values: InsertRunValues) {
  const db = getDb()
  const [row] = await db
    .insert(runs)
    .values({
      walletAddress: values.walletAddress,
      courseDate: values.courseDate,
      inputLog: values.inputLog,
      claimedScore: String(values.claimedScore),
      claimedTimeMs: values.claimedTimeMs,
      verifiedScore: values.verifiedScore === null ? null : String(values.verifiedScore),
      verifiedTimeMs: values.verifiedTimeMs,
      status: values.status,
    })
    .returning()
  if (!row) {
    throw new Error('Failed to insert run')
  }
  return row
}

export async function listRunsForWallet(wallet: string, date?: string, limit = 20) {
  const db = getDb()
  const where = date
    ? and(eq(runs.walletAddress, wallet), eq(runs.courseDate, date))
    : eq(runs.walletAddress, wallet)
  return db
    .select()
    .from(runs)
    .where(where)
    .orderBy(desc(runs.createdAt))
    .limit(limit)
}

export async function listVerifiedRunsForRelay(limit = 100) {
  const db = getDb()
  return db
    .select()
    .from(runs)
    .where(eq(runs.status, 'verified'))
    .orderBy(asc(runs.createdAt))
    .limit(limit)
}

export async function markRunsRelayed(entries: Array<{ id: string; txHash: string }>): Promise<void> {
  const db = getDb()
  for (const entry of entries) {
    await db
      .update(runs)
      .set({ status: 'relayed', onchainTxHash: entry.txHash })
      .where(eq(runs.id, entry.id))
  }
}

export async function tombstoneOldInputLogs(olderThan: Date): Promise<number> {
  const db = getDb()
  const updated = await db
    .update(runs)
    .set({ inputLog: {} })
    .where(lt(runs.createdAt, olderThan))
    .returning({ id: runs.id })
  return updated.length
}
