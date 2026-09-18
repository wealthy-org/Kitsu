import { and, asc, eq, sql } from 'drizzle-orm'
import { leaderboardDaily } from '@/db/schema'
import { getDb } from '@/lib/db/client'
import type { Database } from '@/lib/db/client'

export interface DailyEntry {
  rank: number | null
  wallet_address: string
  best_time_ms: number
  best_score: number
}

export async function listDailyLeaderboard(
  courseDate: string,
  limit: number,
): Promise<DailyEntry[]> {
  const db = getDb()
  const rows = await db
    .select()
    .from(leaderboardDaily)
    .where(eq(leaderboardDaily.courseDate, courseDate))
    .orderBy(asc(leaderboardDaily.bestTimeMs))
    .limit(limit)
  return rows.map((row) => ({
    rank: row.rank,
    wallet_address: row.walletAddress,
    best_time_ms: row.bestTimeMs,
    best_score: Number(row.bestScore),
  }))
}

export async function upsertBestEntry(
  tx: Database,
  values: {
    courseDate: string
    walletAddress: string
    bestTimeMs: number
    bestScore: number
  },
): Promise<boolean> {
  const [existing] = await tx
    .select()
    .from(leaderboardDaily)
    .where(
      and(
        eq(leaderboardDaily.courseDate, values.courseDate),
        eq(leaderboardDaily.walletAddress, values.walletAddress),
      ),
    )
    .limit(1)

  if (existing && existing.bestTimeMs <= values.bestTimeMs) {
    return false
  }

  await tx
    .insert(leaderboardDaily)
    .values({
      courseDate: values.courseDate,
      walletAddress: values.walletAddress,
      bestTimeMs: values.bestTimeMs,
      bestScore: String(values.bestScore),
    })
    .onConflictDoUpdate({
      target: [leaderboardDaily.courseDate, leaderboardDaily.walletAddress],
      set: {
        bestTimeMs: sql`least(${leaderboardDaily.bestTimeMs}, excluded.best_time_ms)`,
        bestScore: sql`case when excluded.best_time_ms < ${leaderboardDaily.bestTimeMs} then excluded.best_score else ${leaderboardDaily.bestScore} end`,
      },
    })
  return true
}

export function computeRank(entries: Array<{ best_time_ms: number }>): number[] {
  return entries.map((_, index) => index + 1)
}
