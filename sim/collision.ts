import { TICK_MS } from './constants'
import type { CourseSegment, LaneName } from './types'

export const LANE_NAMES: readonly LaneName[] = ['left', 'center', 'right']

export function laneNameToIndex(lane: LaneName): number {
  return LANE_NAMES.indexOf(lane)
}

export function movingObstacleLaneIndex(segment: CourseSegment, tick: number): number {
  const base = laneNameToIndex(segment.lane ?? 'center')
  const periodMs = segment.period_ms ?? 2000
  const periodTicks = Math.max(1, Math.round(periodMs / TICK_MS))
  const swing = Math.floor(tick / periodTicks) % 2
  if (swing === 0) {
    return base
  }
  if (base === 1) {
    return 2
  }
  return 1
}

export function blockingLaneIndex(segment: CourseSegment, tick: number): number | null {
  if (segment.type === 'lane_block') {
    return laneNameToIndex(segment.lane ?? 'center')
  }
  if (segment.type === 'moving_obstacle') {
    return movingObstacleLaneIndex(segment, tick)
  }
  return null
}

export function barrierRequirement(segment: CourseSegment): 'jump' | 'slide' | null {
  if (segment.type === 'barrier_high') {
    return 'jump'
  }
  if (segment.type === 'barrier_low') {
    return 'slide'
  }
  return null
}
