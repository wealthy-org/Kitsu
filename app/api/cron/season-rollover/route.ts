import { NextResponse } from 'next/server'
import { isCronAuthorized } from '@/lib/auth/cron'
import { apiError } from '@/lib/http/error'
import { runSeasonRollover } from '@/lib/services/season.service'
import { writeAuditLog } from '@/lib/repositories/audit.repository'

export async function POST(request: Request) {
  if (!isCronAuthorized(request)) {
    return apiError(401, 'UNAUTHENTICATED', 'Invalid cron credentials.')
  }

  try {
    const result = await runSeasonRollover()
    await writeAuditLog('cron.season-rollover', null, { ...result })

    return NextResponse.json({
      status: result.status,
      season_label: result.seasonLabel,
      start_date: result.startDate,
      end_date: result.endDate,
    })
  } catch {
    return apiError(503, 'DEPENDENCY_UNAVAILABLE', 'Season rollover failed.')
  }
}
