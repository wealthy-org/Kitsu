// @vitest-environment node
import { afterAll, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { leaderboardDaily } from '@/db/schema'
import { getDb } from '@/lib/db/client'
import { listDailyLeaderboard, upsertBestEntry } from '@/lib/repositories/leaderboard.repository'

const hasDatabase = Boolean(process.env.DATABASE_URL)
const COURSE_DATE = '2099-01-01'
const TIMEOUT = 20000

afterAll(async () => {
  if (hasDatabase) {
    await getDb().delete(leaderboardDaily).where(eq(leaderboardDaily.courseDate, COURSE_DATE))
  }
}, TIMEOUT)

describe.skipIf(!hasDatabase)('leaderboard best-of-day (database)', () => {
  it(
    'does not let a slower run replace the best',
    async () => {
      const db = getDb()
      await upsertBestEntry(db, {
        courseDate: COURSE_DATE,
        walletAddress: '0xtest-slower',
        bestTimeMs: 5000,
        bestScore: 10,
      })
      const updated = await upsertBestEntry(db, {
        courseDate: COURSE_DATE,
        walletAddress: '0xtest-slower',
        bestTimeMs: 6000,
        bestScore: 20,
      })
      expect(updated).toBe(false)
      const entries = await listDailyLeaderboard(COURSE_DATE, 10)
      const entry = entries.find((row) => row.wallet_address === '0xtest-slower')
      expect(entry?.best_time_ms).toBe(5000)
      expect(entry?.best_score).toBe(10)
    },
    TIMEOUT,
  )

  it(
    'replaces the entry when a faster run arrives',
    async () => {
      const db = getDb()
      await upsertBestEntry(db, {
        courseDate: COURSE_DATE,
        walletAddress: '0xtest-faster',
        bestTimeMs: 9000,
        bestScore: 5,
      })
      const updated = await upsertBestEntry(db, {
        courseDate: COURSE_DATE,
        walletAddress: '0xtest-faster',
        bestTimeMs: 4000,
        bestScore: 15,
      })
      expect(updated).toBe(true)
      const entries = await listDailyLeaderboard(COURSE_DATE, 10)
      const entry = entries.find((row) => row.wallet_address === '0xtest-faster')
      expect(entry?.best_time_ms).toBe(4000)
      expect(entry?.best_score).toBe(15)
    },
    TIMEOUT,
  )

  it(
    'orders entries by finish time ascending',
    async () => {
      const entries = await listDailyLeaderboard(COURSE_DATE, 10)
      const times = entries.map((row) => row.best_time_ms)
      expect(times).toEqual([...times].sort((a, b) => a - b))
    },
    TIMEOUT,
  )
})
