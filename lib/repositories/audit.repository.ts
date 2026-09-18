import { lt } from 'drizzle-orm'
import { auditLogs } from '@/db/schema'
import { getDb } from '@/lib/db/client'

export type AuditEventType =
  | 'cron.publish'
  | 'cron.relay'
  | 'run.verified'
  | 'run.rejected'
  | 'reward.distributed'
  | 'auth.failure'

export async function writeAuditLog(
  eventType: AuditEventType,
  actorWallet: string | null,
  detail: Record<string, unknown> = {},
): Promise<void> {
  const db = getDb()
  await db.insert(auditLogs).values({ eventType, actorWallet, detail })
}

export async function pruneAuditLogs(olderThan: Date): Promise<number> {
  const db = getDb()
  const removed = await db
    .delete(auditLogs)
    .where(lt(auditLogs.createdAt, olderThan))
    .returning({ id: auditLogs.id })
  return removed.length
}
