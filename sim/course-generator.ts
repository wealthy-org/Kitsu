import {
  ACCELERATION,
  COIN_TOTAL_MAX,
  COIN_TOTAL_MIN,
  INITIAL_SPEED,
  JUMP_SECONDS,
  MAX_SPEED,
} from './constants'
import { createRandom, randomInt, type SeededRandom } from './prng'
import type { Course, CourseSegment, LaneName } from './types'

const START_DISTANCE = 60
const END_BUFFER = 80
const MIN_SPACING = 28
const MAX_SPACING = 55
const LEVEL_COUNT_MIN = 20
const LEVEL_COUNT_MAX = 28
const GAP_SPEC_MAX = 6
const GAP_SAFETY_FACTOR = 0.5
const GAP_CLEAR_MARGIN = 0.8
const COIN_EDGE_MARGIN = 5
const COIN_SPACING_MIN = 1.8
const COIN_SPACING_MAX = 5

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
  if (roll < 0.78) {
    const maxWidth = Math.floor(speedAtDistance(distance) * JUMP_SECONDS * GAP_SAFETY_FACTOR)
    const width = Math.min(GAP_SPEC_MAX, maxWidth)
    if (width >= 2) {
      return { distance, type: 'gap', width }
    }
    return { distance, type: 'barrier_high' }
  }
  return {
    distance,
    type: 'moving_obstacle',
    lane: pickLane(rng),
    pattern: 'swing',
    period_ms: randomInt(rng, 1500, 2500),
  }
}

// One `coin_row` is one coin (worth COIN_VALUE). Streams of single-coin segments run between
// obstacles; the course holds COIN_TOTAL_MIN..MAX coins (PROJECT.md §1.7). Deterministic.
function addCoins(segments: CourseSegment[], rng: SeededRandom): void {
  const gaps: Array<{ start: number; end: number }> = []
  for (let i = 0; i < segments.length - 1; i += 1) {
    const start = segments[i].distance + COIN_EDGE_MARGIN
    const end = segments[i + 1].distance - COIN_EDGE_MARGIN
    if (end - start >= COIN_SPACING_MIN) {
      gaps.push({ start, end })
    }
  }
  if (gaps.length === 0) {
    return
  }

  const totalLength = gaps.reduce((sum, gap) => sum + (gap.end - gap.start), 0)
  const target = randomInt(rng, COIN_TOTAL_MIN, COIN_TOTAL_MAX)
  let spacing = Math.min(COIN_SPACING_MAX, Math.max(COIN_SPACING_MIN, totalLength / target))

  const build = (): CourseSegment[] => {
    const coins: CourseSegment[] = []
    for (const gap of gaps) {
      const lane = pickLane(rng)
      for (let d = gap.start; d <= gap.end; d += spacing) {
        coins.push({ distance: Math.round(d), type: 'coin_row', lane })
      }
    }
    return coins
  }

  let coins = build()
  let guard = 0
  while (coins.length < COIN_TOTAL_MIN && spacing > COIN_SPACING_MIN && guard < 24) {
    spacing = Math.max(COIN_SPACING_MIN, spacing - 0.25)
    coins = build()
    guard += 1
  }
  if (coins.length > COIN_TOTAL_MAX) {
    coins = coins.slice(0, COIN_TOTAL_MAX)
  }

  const merged = [...segments, ...coins].sort((a, b) => a.distance - b.distance)
  segments.length = 0
  segments.push(...merged)
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

  addCoins(segments, rng)

  const finishBase = segments.length > 0 ? Math.max(...segments.map((s) => s.distance)) : distance

  return {
    seed,
    finish_distance: finishBase + END_BUFFER,
    segments,
  }
}
