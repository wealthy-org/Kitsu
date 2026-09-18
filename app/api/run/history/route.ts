import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionWallet } from '@/lib/auth/session'
import { DbSessionStore } from '@/lib/auth/session-store'
import { apiError } from '@/lib/http/error'
import { listRunsForWallet } from '@/lib/repositories/run.repository'

const querySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
})

export async function GET(request: Request) {
  const wallet = await getSessionWallet(new DbSessionStore(), request)
  if (!wallet) {
    return apiError(401, 'UNAUTHENTICATED', 'No active session.')
  }

  const url = new URL(request.url)
  const parsed = querySchema.safeParse({
    date: url.searchParams.get('date') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
  })
  if (!parsed.success) {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid query parameters.')
  }

  const rows = await listRunsForWallet(wallet, parsed.data.date, parsed.data.limit ?? 20)
  return NextResponse.json({
    runs: rows.map((row) => ({
      id: row.id,
      course_date: row.courseDate,
      status: row.status,
      verified_time_ms: row.verifiedTimeMs,
      verified_score: row.verifiedScore === null ? null : Number(row.verifiedScore),
      onchain_tx_hash: row.onchainTxHash,
      created_at: row.createdAt,
    })),
  })
}
