import { NextResponse } from 'next/server'
import { isCronAuthorized } from '@/lib/auth/cron'
import { publishCourseOnChain } from '@/lib/chain/contract-client'
import { apiError } from '@/lib/http/error'
import { writeAuditLog } from '@/lib/repositories/audit.repository'
import {
  getCourseStatus,
  getOrCreateCourse,
  setCoursePublished,
} from '@/lib/repositories/course.repository'
import { todayIso } from '@/lib/util/date'
import { dailySeed } from '@/sim/prng'

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export async function POST(request: Request) {
  if (!isCronAuthorized(request)) {
    return apiError(401, 'UNAUTHENTICATED', 'Invalid cron credentials.')
  }

  let courseDate = todayIso()
  try {
    const body = (await request.json()) as { date?: unknown }
    if (typeof body?.date === 'string') {
      if (!DATE_PATTERN.test(body.date)) {
        return apiError(400, 'VALIDATION_ERROR', 'date must be YYYY-MM-DD.')
      }
      courseDate = body.date
    }
  } catch {
    // No body provided; default to today.
  }

  try {
    const course = await getOrCreateCourse(courseDate, dailySeed(courseDate))
    const status = await getCourseStatus(courseDate)
    if (status?.status === 'published') {
      return NextResponse.json({ course_date: courseDate, status: 'already_published' })
    }

    const txHash = await publishCourseOnChain(courseDate, course.seed)
    await setCoursePublished(courseDate, txHash)
    await writeAuditLog('cron.publish', null, { courseDate, txHash })

    return NextResponse.json({
      course_date: courseDate,
      status: 'published',
      onchain_tx_hash: txHash,
    })
  } catch {
    return apiError(503, 'DEPENDENCY_UNAVAILABLE', 'Course publish failed.')
  }
}
