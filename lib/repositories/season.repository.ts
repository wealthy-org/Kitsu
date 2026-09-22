import { and, asc, desc, eq, gte, inArray, lt, lte, sql } from 'drizzle-orm'
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

export interface SeasonBestRow {
  courseDate: string
  walletAddress: string
  bestScore: number
}

export type SeasonRunStatus = 'verified' | 'relayed'

// One row per wallet per day: that day's best score. Replaying a course cannot farm points because
// only the day's best counts. Callers choose the statuses: the live board uses verified and relayed,
// while reward entitlement must stay on relayed only.
export async function listSeasonDailyBests(
  startDate: string,
  endDate: string,
  statuses: SeasonRunStatus[] = ['verified', 'relayed'],
): Promise<SeasonBestRow[]> {
  const db = getDb()
  return db
    .select({
      courseDate: runs.courseDate,
      walletAddress: runs.walletAddress,
      bestScore: sql<number>`max(${runs.verifiedScore})::int`,
    })
    .from(runs)
    .where(
      and(
        inArray(runs.status, statuses),
        gte(runs.courseDate, startDate),
        lte(runs.courseDate, endDate),
      ),
    )
    .groupBy(runs.courseDate, runs.walletAddress)
    .orderBy(asc(runs.courseDate), asc(runs.walletAddress))
}

export async function getEarliestRunDate(
  statuses: SeasonRunStatus[] = ['verified', 'relayed'],
): Promise<string | null> {
  const db = getDb()
  const [row] = await db
    .select({ earliest: sql<string | null>`min(${runs.courseDate})` })
    .from(runs)
    .where(inArray(runs.status, statuses))
  return row?.earliest ?? null
}

export async function createSeason(input: {
  label: string
  startDate: string
  endDate: string
  pool: string
}): Promise<SeasonRow> {
  const db = getDb()
  const [row] = await db
    .insert(seasons)
    .values({
      label: input.label,
      startDate: input.startDate,
      endDate: input.endDate,
      pool: input.pool,
    })
    .returning()
  return row
}

export async function hasSeasonEndingOnOrAfter(date: string): Promise<boolean> {
  const db = getDb()
  const [row] = await db
    .select({ label: seasons.label })
    .from(seasons)
    .where(gte(seasons.endDate, date))
    .limit(1)
  return Boolean(row)
}

export async function getSeasonEndingBefore(date: string): Promise<SeasonRow | null> {
  const db = getDb()
  const [row] = await db
    .select()
    .from(seasons)
    .where(lt(seasons.endDate, date))
    .orderBy(desc(seasons.endDate))
    .limit(1)
  return row ?? null
}
