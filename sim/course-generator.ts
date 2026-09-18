import { ACCELERATION, INITIAL_SPEED, JUMP_SECONDS, MAX_SPEED } from './constants'
import { createRandom, randomInt, type SeededRandom } from './prng'
import type { Course, CourseSegment, LaneName } from './types'

const START_DISTANCE = 60
const END_BUFFER = 80
const MIN_SPACING = 28
const MAX_SPACING = 55
const LEVEL_COUNT_MIN = 12
const LEVEL_COUNT_MAX = 20
const GAP_SPEC_MAX = 6
const GAP_CLEAR_MARGIN = 0.6

export function speedAtDistance(distance: number): number {
  const accel = ACCELERATION
  const initial = INITIAL_SPEED
  const max = MAX_SPEED
  const timeToMax = (max - initial) / accel
  const distanceToMax = initial * timeToMax + 0.5 * accel * timeToMax * timeToMax
  if (distance >= distanceToMax) {
    return max
  }
  const discriminant = initial * initial + 2 * accel * distance
  const time = (-initial + Math.sqrt(discriminant)) / accel
  return initial + accel * time
}

export function maxClearableGap(distance: number): number {
  return speedAtDistance(distance) * JUMP_SECONDS * GAP_CLEAR_MARGIN
}

function pickLane(rng: SeededRandom): LaneName {
  const roll = rng()
  if (roll < 1 / 3) {
    return 'left'
  }
  if (roll < 2 / 3) {
    return 'center'
  }
  return 'right'
}

function buildSegment(distance: number, rng: SeededRandom): CourseSegment {
  const roll = rng()
  if (roll < 0.2) {
    return { distance, type: 'barrier_high' }
  }
  if (roll < 0.4) {
    return { distance, type: 'barrier_low' }
  }
  if (roll < 0.6) {
    return { distance, type: 'lane_block', lane: pickLane(rng) }
  }
  if (roll < 0.75) {
    const clearable = Math.floor(maxClearableGap(distance))
    const width = Math.max(1, Math.min(GAP_SPEC_MAX, clearable))
    return { distance, type: 'gap', width }
  }
  if (roll < 0.9) {
    return {
      distance,
      type: 'moving_obstacle',
      lane: pickLane(rng),
      pattern: 'swing',
      period_ms: randomInt(rng, 1500, 2500),
    }
  }
  return { distance, type: 'coin_row', lane: pickLane(rng) }
}

export function generateCourse(seed: string): Course {
  const rng = createRandom(seed)
  const levelCount = randomInt(rng, LEVEL_COUNT_MIN, LEVEL_COUNT_MAX)
  const segments: CourseSegment[] = []
  let distance = START_DISTANCE

  for (let i = 0; i < levelCount; i += 1) {
    distance += randomInt(rng, MIN_SPACING, MAX_SPACING)
    segments.push(buildSegment(distance, rng))
  }

  return {
    seed,
    finish_distance: distance + END_BUFFER,
    segments,
  }
}
