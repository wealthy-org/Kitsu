import { NextResponse } from 'next/server'
import { apiError } from '@/lib/http/error'
import { getCourseStatus, getOrCreateCourse } from '@/lib/repositories/course.repository'
import { todayIso } from '@/lib/util/date'
import { dailySeed } from '@/sim/prng'

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export async function GET(request: Request) {
  const url = new URL(request.url)
  const dateParam = url.searchParams.get('date')
  const courseDate = dateParam && DATE_PATTERN.test(dateParam) ? dateParam : todayIso()

  try {
    const course = await getOrCreateCourse(courseDate, dailySeed(courseDate))
    const record = await getCourseStatus(courseDate)
    return NextResponse.json({
      course_date: courseDate,
      seed: course.seed,
      segments: course.segments,
      status: record?.status ?? 'draft',
      onchain_tx_hash: record?.onchainTxHash ?? null,
    })
  } catch {
    return apiError(503, 'DEPENDENCY_UNAVAILABLE', 'Course is temporarily unavailable.')
  }
}
