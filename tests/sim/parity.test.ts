import { describe, expect, it } from 'vitest'
import { verifyRun, verifyRunResult } from '@/lib/services/run-verify.service'
import { generateCourse } from '@/sim/course-generator'
import { dailySeed } from '@/sim/prng'
import { simulate } from '@/sim/run'
import { tickAtDistance } from '@/tests/sim/helpers'
import type { Course, InputLog } from '@/sim/types'

describe('replay verification parity', () => {
  it('matches the engine re-simulation for the same seed and log', () => {
    const seed = dailySeed('2026-09-18')
    const log: InputLog = []
    const engine = simulate(generateCourse(seed), log)
    const verified = verifyRun(seed, log)
    expect(verified.completed).toBe(engine.completed)
    expect(verified.time_ms).toBe(engine.completed ? engine.time_ms : null)
    expect(verified.coins_collected).toBe(engine.completed ? engine.coins_collected : 0)
  })

  it('accepts a crafted completing course', () => {
    const course: Course = {
      seed: 'parity-course',
      finish_distance: 260,
      segments: [
        { distance: 50, type: 'barrier_high' },
        { distance: 210, type: 'gap', width: 2 },
      ],
    }
    const log: InputLog = [
      { tick: tickAtDistance(50) - 10, action: 'jump' },
      { tick: tickAtDistance(210) - 10, action: 'jump' },
    ]
    const result = verifyRunResult(course, log)
    expect(result.verified).toBe(true)
    expect(result.completed).toBe(true)
    expect(result.time_ms).toBeGreaterThan(0)
    expect(result.score).toBe(0)
  })

  it('rejects a failed run without leaking partial rewards', () => {
    const course: Course = {
      seed: 'parity-fail',
      finish_distance: 200,
      segments: [{ distance: 80, type: 'coin_row', lane: 'center' }, { distance: 100, type: 'barrier_high' }],
    }
    const result = verifyRunResult(course, [])
    expect(result.verified).toBe(false)
    expect(result.time_ms).toBeNull()
    expect(result.coins_collected).toBe(0)
    expect(result.score).toBe(0)
  })
})
