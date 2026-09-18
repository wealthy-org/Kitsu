import { describe, expect, it } from 'vitest'
import { verifyRunResult } from '@/lib/services/run-verify.service'
import { tickAtDistance } from '@/tests/sim/helpers'
import type { Course, InputLog } from '@/sim/types'

const COURSE: Course = {
  seed: 'perf-course',
  finish_distance: 400,
  segments: [
    { distance: 60, type: 'barrier_high' },
    { distance: 120, type: 'gap', width: 2 },
    { distance: 180, type: 'barrier_low' },
    { distance: 260, type: 'gap', width: 3 },
  ],
}

const LOG: InputLog = [
  { tick: tickAtDistance(60) - 10, action: 'jump' },
  { tick: tickAtDistance(120) - 10, action: 'jump' },
  { tick: tickAtDistance(180) - 10, action: 'slide' },
  { tick: tickAtDistance(260) - 10, action: 'jump' },
]

describe('re-simulation performance', () => {
  it('verifies a full run well under 3 seconds', () => {
    const start = performance.now()
    const result = verifyRunResult(COURSE, LOG)
    const elapsed = performance.now() - start
    expect(result.verified).toBe(true)
    expect(elapsed).toBeLessThan(3000)
  })
})
