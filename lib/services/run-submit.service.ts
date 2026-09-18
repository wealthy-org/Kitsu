import { DbNonceStore } from '@/lib/auth/nonce-store'
import { redeemNonce } from '@/lib/auth/nonce'
import { verifyRunNonceSignature } from '@/lib/auth/run-nonce'
import { getDb } from '@/lib/db/client'
import { writeAuditLog } from '@/lib/repositories/audit.repository'
import { getOrCreateCourse } from '@/lib/repositories/course.repository'
import { listDailyLeaderboard, upsertBestEntry } from '@/lib/repositories/leaderboard.repository'
import { insertRun } from '@/lib/repositories/run.repository'
import { verifyRunResult } from '@/lib/services/run-verify.service'
import { MAX_DAILY_SUBMITS, countDailySubmissions } from '@/lib/services/rate-limit.service'
import { dailySeed } from '@/sim/prng'
import type { InputLog } from '@/sim/types'

export type SubmitErrorCode =
  | 'INVALID_RUN_SIGNATURE'
  | 'NONCE_EXPIRED'
  | 'NONCE_REUSED'
  | 'RATE_LIMITED'
  | 'RUN_NOT_COMPLETED'
  | 'RUN_REJECTED'

export interface SubmitSuccess {
  runId: string
  status: 'verified'
  verifiedTimeMs: number
  verifiedScore: number
  isBest: boolean
  rank: number | null
}

export type SubmitOutcome = { ok: true; data: SubmitSuccess } | { ok: false; code: SubmitErrorCode }

export interface SubmitRunParams {
  wallet: string
  courseDate: string
  inputLog: InputLog
  claimedTimeMs: number
  claimedScore: number
  nonce: string
  signature: string
}

export async function submitRun(params: SubmitRunParams): Promise<SubmitOutcome> {
  const wallet = params.wallet.toLowerCase()

  if (!(await verifyRunNonceSignature(wallet, params.nonce, params.signature))) {
    return { ok: false, code: 'INVALID_RUN_SIGNATURE' }
  }

  const redeemed = await redeemNonce(new DbNonceStore(), params.nonce, wallet, 'submit')
  if (redeemed.status === 'expired') {
    return { ok: false, code: 'NONCE_EXPIRED' }
  }
  if (redeemed.status !== 'ok') {
    return { ok: false, code: 'NONCE_REUSED' }
  }

  if ((await countDailySubmissions(wallet, params.courseDate)) >= MAX_DAILY_SUBMITS) {
    return { ok: false, code: 'RATE_LIMITED' }
  }

  const course = await getOrCreateCourse(params.courseDate, dailySeed(params.courseDate))
  const verified = verifyRunResult(course, params.inputLog)

  if (!verified.verified || verified.time_ms === null) {
    await insertRun({
      walletAddress: wallet,
      courseDate: params.courseDate,
      inputLog: params.inputLog,
      claimedScore: params.claimedScore,
      claimedTimeMs: params.claimedTimeMs,
      verifiedScore: null,
      verifiedTimeMs: null,
      status: 'rejected',
    })
    await writeAuditLog('run.rejected', wallet, {
      reason: 'not_completed',
      courseDate: params.courseDate,
    })
    return { ok: false, code: 'RUN_NOT_COMPLETED' }
  }

  const claimMatches =
    verified.time_ms === params.claimedTimeMs && verified.score === params.claimedScore
  if (!claimMatches) {
    await insertRun({
      walletAddress: wallet,
      courseDate: params.courseDate,
      inputLog: params.inputLog,
      claimedScore: params.claimedScore,
      claimedTimeMs: params.claimedTimeMs,
      verifiedScore: verified.score,
      verifiedTimeMs: verified.time_ms,
      status: 'rejected',
    })
    await writeAuditLog('run.rejected', wallet, {
      reason: 'claim_mismatch',
      courseDate: params.courseDate,
    })
    return { ok: false, code: 'RUN_REJECTED' }
  }

  const run = await insertRun({
    walletAddress: wallet,
    courseDate: params.courseDate,
    inputLog: params.inputLog,
    claimedScore: params.claimedScore,
    claimedTimeMs: params.claimedTimeMs,
    verifiedScore: verified.score,
    verifiedTimeMs: verified.time_ms,
    status: 'verified',
  })

  const isBest = await upsertBestEntry(getDb(), {
    courseDate: params.courseDate,
    walletAddress: wallet,
    bestTimeMs: verified.time_ms,
    bestScore: verified.score,
  })

  await writeAuditLog('run.verified', wallet, {
    courseDate: params.courseDate,
    timeMs: verified.time_ms,
  })

  const entries = await listDailyLeaderboard(params.courseDate, 100)
  const index = entries.findIndex((entry) => entry.wallet_address === wallet)

  return {
    ok: true,
    data: {
      runId: run.id,
      status: 'verified',
      verifiedTimeMs: verified.time_ms,
      verifiedScore: verified.score,
      isBest,
      rank: index >= 0 ? index + 1 : null,
    },
  }
}
