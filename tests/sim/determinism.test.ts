import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  ACCELERATION,
  INITIAL_SPEED,
  JUMP_TICKS,
  LANE_SWITCH_TICKS,
  MAX_SPEED,
  SECONDS_PER_TICK,
} from '@/sim/constants'
import { generateCourse, maxClearableGap } from '@/sim/course-generator'
import { dailySeed } from '@/sim/prng'
import { simulate } from '@/sim/run'
import { scoreFromCoins } from '@/sim/scoring'
import type { Course, InputLog } from '@/sim/types'

function tickAtDistance(distance: number): number {
  const timeToMax = (MAX_SPEED - INITIAL_SPEED) / ACCELERATION
  const distanceToMax = INITIAL_SPEED * timeToMax + 0.5 * ACCELERATION * timeToMax * timeToMax
  if (distance >= distanceToMax) {
    const remaining = (distance - distanceToMax) / MAX_SPEED
    return Math.ceil((timeToMax + remaining) / SECONDS_PER_TICK)
  }
  const discriminant = INITIAL_SPEED * INITIAL_SPEED + 2 * ACCELERATION * distance
  const time = (-INITIAL_SPEED + Math.sqrt(discriminant)) / ACCELERATION
  return Math.ceil(time / SECONDS_PER_TICK)
}

const SEED = dailySeed('2026-09-18')

describe('deterministic course generation', () => {
  it('generates identical segments for the same seed', () => {
    const first = generateCourse(SEED)
    const second = generateCourse(SEED)
    expect(JSON.stringify(first)).toBe(JSON.stringify(second))
  })

  it('keeps every gap clearable at its distance', () => {
    for (const date of ['2026-09-18', '2026-09-19', '2026-12-31']) {
      const course = generateCourse(dailySeed(date))
      for (const segment of course.segments) {
        if (segment.type === 'gap') {
          expect(segment.width ?? 0).toBeLessThanOrEqual(maxClearableGap(segment.distance) + 1e-9)
          expect(segment.width ?? 0).toBeGreaterThan(0)
        }
      }
    }
  })

  it('places the finish after the last segment', () => {
    const course = generateCourse(SEED)
    const last = course.segments[course.segments.length - 1]
    expect(course.finish_distance).toBeGreaterThan(last.distance)
  })
})

describe('deterministic simulation', () => {
  it('produces identical results for identical input', () => {
    const course = generateCourse(SEED)
    const log: InputLog = []
    const first = simulate(course, log)
    const second = simulate(course, log)
    expect(first).toEqual(second)
  })

  it('completes a crafted course when inputs are timed', () => {
    const course: Course = {
      seed: 'test-course',
      finish_distance: 260,
      segments: [
        { distance: 50, type: 'barrier_high' },
        { distance: 100, type: 'barrier_low' },
        { distance: 150, type: 'lane_block', lane: 'center' },
        { distance: 210, type: 'gap', width: 2 },
      ],
    }
    const log: InputLog = [
      { tick: tickAtDistance(50) - 10, action: 'jump' },
      { tick: tickAtDistance(100) - 10, action: 'slide' },
      { tick: tickAtDistance(150) - LANE_SWITCH_TICKS - 5, action: 'left' },
      { tick: tickAtDistance(210) - 10, action: 'jump' },
    ]
    const result = simulate(course, log)
    expect(result.completed).toBe(true)
    expect(result.time_ms).toBeGreaterThan(0)
  })

  it('ends the run on an unhandled barrier', () => {
    const course: Course = {
      seed: 'fail-course',
      finish_distance: 200,
      segments: [{ distance: 50, type: 'barrier_high' }],
    }
    const result = simulate(course, [])
    expect(result.completed).toBe(false)
    expect(result.failure?.segment_index).toBe(0)
  })

  it('collects a coin row and scores from coins', () => {
    const course: Course = {
      seed: 'coin-course',
      finish_distance: 200,
      segments: [{ distance: 80, type: 'coin_row', lane: 'center' }],
    }
    const result = simulate(course, [])
    expect(result.completed).toBe(true)
    expect(result.coins_collected).toBe(1)
    expect(scoreFromCoins(result.coins_collected)).toBe(10)
  })

  it('keeps jump duration within the configured constant', () => {
    expect(JUMP_TICKS).toBe(60)
  })
})

describe('sim purity', () => {
  it('never uses Math.random', () => {
    const dir = join(process.cwd(), 'sim')
    const files = readdirSync(dir).filter((file) => file.endsWith('.ts'))
    expect(files.length).toBeGreaterThan(0)
    for (const file of files) {
      const content = readFileSync(join(dir, file), 'utf8')
      expect(content.includes('Math.random')).toBe(false)
    }
  })
})
