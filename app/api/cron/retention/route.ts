import { NextResponse } from 'next/server'
import { isCronAuthorized } from '@/lib/auth/cron'
import { apiError } from '@/lib/http/error'
import { runRetention } from '@/lib/jobs/retention'
import { writeAuditLog } from '@/lib/repositories/audit.repository'

export async function POST(request: Request) {
  if (!isCronAuthorized(request)) {
    return apiError(401, 'UNAUTHENTICATED', 'Invalid cron credentials.')
  }

  try {
    const result = await runRetention()
    await writeAuditLog('cron.retention', null, { ...result })
    return NextResponse.json({
      tombstoned_input_logs: result.tombstonedInputLogs,
      pruned_audit_logs: result.prunedAuditLogs,
    })
  } catch {
    return apiError(503, 'DEPENDENCY_UNAVAILABLE', 'Retention failed.')
  }
}
