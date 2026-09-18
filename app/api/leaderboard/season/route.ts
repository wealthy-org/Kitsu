import { NextResponse } from 'next/server'
import { apiError } from '@/lib/http/error'
import {
  getActiveSeason,
  getSeasonByLabel,
  listRelayedBests,
} from '@/lib/repositories/season.repository'
import { computeStandings } from '@/lib/services/season-reward.service'
import { todayIso } from '@/lib/util/date'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const label = url.searchParams.get('label')

  try {
    const season = label ? await getSeasonByLabel(label) : await getActiveSeason(todayIso())
    if (!season) {
      return apiError(404, 'SEASON_NOT_FOUND', 'No season for the requested label.')
    }

    const rows = await listRelayedBests(season.startDate, season.endDate)
    const { entries } = computeStandings(rows, Number(season.pool))

    return NextResponse.json({
      season_label: season.label,
      entries: entries.map((entry) => ({
        rank: entry.rank,
        wallet_address: entry.walletAddress,
        points: entry.points,
        reward_amount: entry.rewardAmount,
      })),
      meta: { count: entries.length },
    })
  } catch {
    return apiError(503, 'DEPENDENCY_UNAVAILABLE', 'Season leaderboard is temporarily unavailable.')
  }
}
