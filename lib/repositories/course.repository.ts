import { eq } from 'drizzle-orm'
import { dailyCourses } from '@/db/schema'
import { getDb } from '@/lib/db/client'
import { generateCourse } from '@/sim/course-generator'
import type { Course } from '@/sim/types'

interface CoursePayload {
  finish_distance: number
  segments: Course['segments']
}

export async function getCourseByDate(courseDate: string): Promise<Course | null> {
  const db = getDb()
  const [row] = await db
    .select()
    .from(dailyCourses)
    .where(eq(dailyCourses.courseDate, courseDate))
    .limit(1)
  if (!row) {
    return null
  }
  const payload = row.segments as CoursePayload
  return { seed: row.seed, finish_distance: payload.finish_distance, segments: payload.segments }
}

export async function getOrCreateCourse(courseDate: string, seed: string): Promise<Course> {
  const existing = await getCourseByDate(courseDate)
  if (existing) {
    return existing
  }
  const course = generateCourse(seed)
  const payload: CoursePayload = {
    finish_distance: course.finish_distance,
    segments: course.segments,
  }
  const db = getDb()
  await db
    .insert(dailyCourses)
    .values({ courseDate, seed, segments: payload })
    .onConflictDoNothing({ target: dailyCourses.courseDate })
  return (await getCourseByDate(courseDate)) ?? course
}

export async function getCourseStatus(
  courseDate: string,
): Promise<{ status: string; onchainTxHash: string | null } | null> {
  const db = getDb()
  const [row] = await db
    .select({ status: dailyCourses.status, onchainTxHash: dailyCourses.onchainTxHash })
    .from(dailyCourses)
    .where(eq(dailyCourses.courseDate, courseDate))
    .limit(1)
  return row ?? null
}

export async function setCoursePublished(
  courseDate: string,
  onchainTxHash: string | null,
): Promise<void> {
  const db = getDb()
  await db
    .update(dailyCourses)
    .set({ status: 'published', onchainTxHash })
    .where(eq(dailyCourses.courseDate, courseDate))
}
