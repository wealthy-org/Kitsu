import { NextResponse } from 'next/server'
import { z } from 'zod'
import { apiError } from '@/lib/http/error'
import {
  computeRank,
  listDailyLeaderboard,
} from '@/lib/repositories/leaderboard.repository'
import { todayIso } from '@/lib/util/date'

const querySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
})

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
  const limit = parsed.data.limit ?? 100
  const entries = await listDailyLeaderboard(courseDate, limit)
  const ranks = computeRank(entries)

  return NextResponse.json({
    course_date: courseDate,
    entries: entries.map((entry, index) => ({
      rank: ranks[index],
      wallet_address: entry.wallet_address,
      best_time_ms: entry.best_time_ms,
      best_score: entry.best_score,
    })),
    meta: { limit, count: entries.length },
  })
}
