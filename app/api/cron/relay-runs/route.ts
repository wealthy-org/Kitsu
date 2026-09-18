import { NextResponse } from 'next/server'
import { isCronAuthorized } from '@/lib/auth/cron'
import { relayRunOnChain } from '@/lib/chain/contract-client'
import { apiError } from '@/lib/http/error'
import { writeAuditLog } from '@/lib/repositories/audit.repository'
import { listVerifiedRunsForRelay, markRunsRelayed } from '@/lib/repositories/run.repository'

const BATCH_SIZE = 10

export async function POST(request: Request) {
  if (!isCronAuthorized(request)) {
    return apiError(401, 'UNAUTHENTICATED', 'Invalid cron credentials.')
  }

  try {
    const runs = await listVerifiedRunsForRelay(BATCH_SIZE)
    if (runs.length === 0) {
      return NextResponse.json({ relayed_count: 0, tx_hash: null, remaining: 0 })
    }

    const relayed: Array<{ id: string; txHash: string }> = []
    let lastTxHash: string | null = null
    for (const run of runs) {
      const createdAt = run.createdAt ? new Date(run.createdAt).getTime() : Date.now()
      const txHash = await relayRunOnChain({
        runId: run.id,
        wallet: run.walletAddress,
        courseDate: run.courseDate,
        score: Number(run.verifiedScore ?? 0),
        timestamp: Math.floor(createdAt / 1000),
      })
      relayed.push({ id: run.id, txHash })
      lastTxHash = txHash
    }

    await markRunsRelayed(relayed)
    await writeAuditLog('cron.relay', null, { count: relayed.length, txHash: lastTxHash })

    const remaining = (await listVerifiedRunsForRelay(1)).length
    return NextResponse.json({ relayed_count: relayed.length, tx_hash: lastTxHash, remaining })
  } catch {
    return apiError(503, 'DEPENDENCY_UNAVAILABLE', 'Run relay failed.')
  }
}
