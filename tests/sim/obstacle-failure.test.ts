import { describe, expect, it } from 'vitest'
import { simulate } from '@/sim/run'
import { tickAtDistance } from '@/tests/sim/helpers'
import type { Course, CourseSegment, InputLog } from '@/sim/types'

function courseWith(segment: CourseSegment): Course {
  return {
    seed: `obstacle-${segment.type}`,
    finish_distance: 200,
    segments: [segment],
  }
}

describe('lethal obstacles end the run', () => {
  const lethal: CourseSegment[] = [
    { distance: 80, type: 'barrier_high' },
    { distance: 80, type: 'barrier_low' },
    { distance: 80, type: 'lane_block', lane: 'center' },
    { distance: 80, type: 'gap', width: 3 },
    { distance: 80, type: 'moving_obstacle', lane: 'center', pattern: 'swing', period_ms: 2000 },
  ]

  for (const segment of lethal) {
    it(`fails on ${segment.type} when the required action is not taken`, () => {
      const course = courseWith(segment)
      const result = simulate(course, [])
      expect(result.completed, `${segment.type} let the run continue`).toBe(false)
      expect(result.failure?.segment_index).toBe(0)
      expect(result.time_ms).toBeGreaterThanOrEqual(0)
    })
  }

  it('lets the run continue past a coin row', () => {
    const course = courseWith({ distance: 80, type: 'coin_row', lane: 'center' })
    const result = simulate(course, [])
    expect(result.completed).toBe(true)
  })

  it('survives barrier_high with a jump and barrier_low with a slide', () => {
    const high: Course = courseWith({ distance: 80, type: 'barrier_high' })
    const highLog: InputLog = [{ tick: tickAtDistance(80) - 6, action: 'jump' }]
    expect(simulate(high, highLog).completed).toBe(true)

    const low: Course = courseWith({ distance: 80, type: 'barrier_low' })
    const lowLog: InputLog = [{ tick: tickAtDistance(80) - 6, action: 'slide' }]
    expect(simulate(low, lowLog).completed).toBe(true)
  })
})
