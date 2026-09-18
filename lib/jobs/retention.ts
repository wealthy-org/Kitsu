import { pruneAuditLogs } from '@/lib/repositories/audit.repository'
import { tombstoneOldInputLogs } from '@/lib/repositories/run.repository'

const DAY_MS = 24 * 60 * 60 * 1000
export const INPUT_LOG_RETENTION_DAYS = 30
export const AUDIT_LOG_RETENTION_DAYS = 30

export interface RetentionResult {
  tombstonedInputLogs: number
  prunedAuditLogs: number
}

export async function runRetention(now: Date = new Date()): Promise<RetentionResult> {
  const inputCutoff = new Date(now.getTime() - INPUT_LOG_RETENTION_DAYS * DAY_MS)
  const auditCutoff = new Date(now.getTime() - AUDIT_LOG_RETENTION_DAYS * DAY_MS)

  const tombstonedInputLogs = await tombstoneOldInputLogs(inputCutoff)
  const prunedAuditLogs = await pruneAuditLogs(auditCutoff)

  return { tombstonedInputLogs, prunedAuditLogs }
}
