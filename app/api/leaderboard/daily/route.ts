import { NextResponse } from 'next/server'
import { z } from 'zod'
import { readDailyCache, writeDailyCache } from '@/lib/cache/leaderboard-cache'
import type { CachedDailyEntry } from '@/lib/cache/leaderboard-cache'
import { apiError } from '@/lib/http/error'
import { computeRank, listDailyLeaderboard } from '@/lib/repositories/leaderboard.repository'
import { todayIso } from '@/lib/util/date'

const DAILY_BOARD_SIZE = 100

const querySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
})

function dailyBoardResponse(courseDate: string, entries: CachedDailyEntry[], limit: number) {
  const limited = entries.slice(0, limit)
  const ranks = computeRank(limited)

  return NextResponse.json({
    course_date: courseDate,
    entries: limited.map((entry, index) => ({
      rank: ranks[index],
      wallet_address: entry.wallet_address,
      best_time_ms: entry.best_time_ms,
      best_score: entry.best_score,
    })),
    meta: { limit, count: limited.length },
  })
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const parsed = querySchema.safeParse({
    date: url.searchParams.get('date') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
  })
  if (!parsed.success) {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid query parameters.')
  }

  const courseDate = parsed.data.date ?? todayIso()
  const limit = parsed.data.limit ?? DAILY_BOARD_SIZE

  const cached = await readDailyCache(courseDate)
  if (cached) {
    return dailyBoardResponse(courseDate, cached, limit)
  }

  try {
    const entries = await listDailyLeaderboard(courseDate, DAILY_BOARD_SIZE)
    await writeDailyCache(courseDate, entries)
    return dailyBoardResponse(courseDate, entries, limit)
  } catch {
    return apiError(503, 'DEPENDENCY_UNAVAILABLE', 'Daily leaderboard is temporarily unavailable.')
  }
}
