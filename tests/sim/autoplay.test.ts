import { describe, expect, it } from 'vitest'
import { generateCourse } from '@/sim/course-generator'
import { barrierRequirement, blockingLaneIndex } from '@/sim/collision'
import {
  ACCELERATION,
  INITIAL_SPEED,
  LANE_SWITCH_TICKS,
  MAX_SPEED,
  MAX_RUN_TICKS,
  SECONDS_PER_TICK,
} from '@/sim/constants'
import { createRunState, stepRun, type RunState } from '@/sim/run'
import type { Course, InputAction } from '@/sim/types'

function speedAtTick(tick: number): number {
  return Math.min(MAX_SPEED, INITIAL_SPEED + ACCELERATION * tick * SECONDS_PER_TICK)
}

function autoplay(course: Course): RunState {
  const state = createRunState(course)
  let guard = 0
  while (state.status === 'running' && guard < MAX_RUN_TICKS + 10) {
    guard += 1
    const actions: InputAction[] = []
    const speed = speedAtTick(state.tick)
    const airborne = state.tick < state.airborneUntil
    const sliding = state.tick < state.slidingUntil

    const nextIndex = course.segments.findIndex((segment, index) => {
      if (state.passed[index]) {
        return false
      }
      if (segment.type === 'coin_row') {
        return false
      }
      return segment.distance >= state.distance
    })

    if (nextIndex >= 0) {
      const segment = course.segments[nextIndex]
      const ahead = segment.distance - state.distance
      const ticksAhead = Math.max(0, Math.round(ahead / (speed * SECONDS_PER_TICK)))
      const requirement = barrierRequirement(segment)

      if (segment.type === 'gap' || requirement === 'jump') {
        if (!airborne && ahead <= speed * 0.6 * 0.4) {
          actions.push('jump')
        }
      } else if (requirement === 'slide') {
        if (!sliding && ahead <= speed * 0.5 * 0.6) {
          actions.push('slide')
        }
      } else {
        const blockedLane = blockingLaneIndex(segment, state.tick + ticksAhead)
        if (blockedLane !== null) {
          const current = state.laneSwitchRemaining > 0 ? state.laneTarget : state.laneIndex
          if (blockedLane === current && ahead > speed * SECONDS_PER_TICK * LANE_SWITCH_TICKS * 1.5) {
            const candidates = [current - 1, current + 1].filter(
              (lane) => lane >= 0 && lane < 3 && lane !== blockedLane,
            )
            const target = candidates[0] ?? (current === 0 ? 1 : 0)
            actions.push(target < current ? 'left' : 'right')
          }
        }
      }
    }

    stepRun(course, state, actions)
  }
  return state
}

describe('daily course is completable', () => {
  for (const date of ['2026-09-18', '2026-09-19', '2026-12-31']) {
    it(`completes the course generated for ${date}`, () => {
      const course = generateCourse(date)
      const state = autoplay(course)
      const failing =
        state.failure && state.failure.segment_index >= 0
          ? course.segments[state.failure.segment_index].type
          : state.failure
            ? 'timeout'
            : 'none'
      expect(
        state.status === 'finished',
        `failed at ${Math.round(state.distance)}m on ${failing}`,
      ).toBe(true)
    })
  }
})
