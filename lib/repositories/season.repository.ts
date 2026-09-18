import { and, asc, eq, gte, lte, sql } from 'drizzle-orm'
import { runs, seasons } from '@/db/schema'
import { getDb } from '@/lib/db/client'

export interface SeasonRow {
  label: string
  startDate: string
  endDate: string
  pool: string
}

export async function getSeasonByLabel(label: string): Promise<SeasonRow | null> {
  const db = getDb()
  const [row] = await db.select().from(seasons).where(eq(seasons.label, label)).limit(1)
  return row ?? null
}

export async function getActiveSeason(today: string): Promise<SeasonRow | null> {
  const db = getDb()
  const [row] = await db
    .select()
    .from(seasons)
    .where(and(lte(seasons.startDate, today), gte(seasons.endDate, today)))
    .orderBy(asc(seasons.startDate))
    .limit(1)
  return row ?? null
}

export interface RelayedBestRow {
  courseDate: string
  walletAddress: string
  bestTimeMs: number
}

export async function listRelayedBests(startDate: string, endDate: string): Promise<RelayedBestRow[]> {
  const db = getDb()
  const rows = await db
    .select({
      courseDate: runs.courseDate,
      walletAddress: runs.walletAddress,
      bestTimeMs: sql<number>`min(${runs.verifiedTimeMs})::int`,
    })
    .from(runs)
    .where(
      and(
        eq(runs.status, 'relayed'),
        gte(runs.courseDate, startDate),
        lte(runs.courseDate, endDate),
      ),
    )
    .groupBy(runs.courseDate, runs.walletAddress)
    .orderBy(asc(runs.courseDate), asc(runs.walletAddress))
  return rows
}
