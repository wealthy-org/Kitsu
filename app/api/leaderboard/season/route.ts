import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionWallet } from '@/lib/auth/session'
import { DbSessionStore } from '@/lib/auth/session-store'
import { apiError } from '@/lib/http/error'
import { getSeasonByLabel, listSeasonDailyBests } from '@/lib/repositories/season.repository'
import { computeSeasonBoard } from '@/lib/services/season-reward.service'
import { ensureActiveSeason } from '@/lib/services/season.service'
import { todayIso } from '@/lib/util/date'

const SEASON_BOARD_CAP = 50
const PAGE_SIZE_DEFAULT = 10
const PAGE_SIZE_MAX = 10

const querySchema = z.object({
  label: z.string().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(PAGE_SIZE_MAX).default(PAGE_SIZE_DEFAULT),
})

export async function GET(request: Request) {
  const url = new URL(request.url)
  const parsed = querySchema.safeParse({
    label: url.searchParams.get('label') ?? undefined,
    page: url.searchParams.get('page') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
  })
  if (!parsed.success) {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid season leaderboard query.')
  }

  const { label, page, limit } = parsed.data

  try {
    const season = label ? await getSeasonByLabel(label) : await ensureActiveSeason(todayIso())
    if (!season) {
      return apiError(404, 'SEASON_NOT_FOUND', 'No season for the requested label.')
    }

    const [provisional, confirmed] = await Promise.all([
      listSeasonDailyBests(season.startDate, season.endDate, ['verified', 'relayed']),
      listSeasonDailyBests(season.startDate, season.endDate, ['relayed']),
    ])
    const { entries } = computeSeasonBoard({
      provisional,
      confirmed,
      pool: Number(season.pool),
    })

    const board = entries.slice(0, SEASON_BOARD_CAP)
    const total = board.length
    const totalPages = Math.max(1, Math.ceil(total / limit))
    const safePage = Math.min(page, totalPages)
    const pageEntries = board.slice((safePage - 1) * limit, safePage * limit)

    let walletAddress: string | null = null
    try {
      walletAddress = await getSessionWallet(new DbSessionStore(), request)
    } catch {
      walletAddress = null
    }

    return NextResponse.json({
      season_label: season.label,
      entries: pageEntries.map((entry) => ({
        rank: entry.rank,
        wallet_address: entry.walletAddress,
        points: entry.points,
        reward_amount: entry.rewardAmount,
      })),
      meta: {
        page: safePage,
        limit,
        count: pageEntries.length,
        total,
        total_pages: totalPages,
        has_next: safePage < totalPages,
        wallet_address: walletAddress,
        provisional: provisional.length !== confirmed.length,
      },
    })
  } catch {
    return apiError(503, 'DEPENDENCY_UNAVAILABLE', 'Season leaderboard is temporarily unavailable.')
  }
}
