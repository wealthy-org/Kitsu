import {
  ACCELERATION,
  INITIAL_SPEED,
  JUMP_TICKS,
  LANE_COUNT,
  LANE_SWITCH_TICKS,
  MAX_RUN_TICKS,
  MAX_SPEED,
  SECONDS_PER_TICK,
  SLIDE_TICKS,
  TICK_MS,
} from './constants'
import { barrierRequirement, blockingLaneIndex, laneNameToIndex } from './collision'
import type { Course, InputAction, InputLog, RunFailure, RunResult } from './types'

export interface RunState {
  tick: number
  distance: number
  laneIndex: number
  laneTarget: number
  laneSwitchRemaining: number
  airborneUntil: number
  slidingUntil: number
  coinsCollected: number
  passed: boolean[]
  status: 'running' | 'finished' | 'failed'
  failure: RunFailure | null
}

export function createRunState(course: Course): RunState {
  return {
    tick: 0,
    distance: 0,
    laneIndex: 1,
    laneTarget: 1,
    laneSwitchRemaining: 0,
    airborneUntil: 0,
    slidingUntil: 0,
    coinsCollected: 0,
    passed: course.segments.map(() => false),
    status: 'running',
    failure: null,
  }
}

function applyActions(state: RunState, actions: InputAction[]): void {
  for (const action of actions) {
    if (action === 'jump') {
      if (state.tick >= state.airborneUntil) {
        state.airborneUntil = state.tick + JUMP_TICKS
      }
    } else if (action === 'slide') {
      if (state.tick >= state.airborneUntil) {
        state.slidingUntil = state.tick + SLIDE_TICKS
      }
    } else {
      const from = state.laneSwitchRemaining > 0 ? state.laneTarget : state.laneIndex
      state.laneTarget =
        action === 'left' ? Math.max(0, from - 1) : Math.min(LANE_COUNT - 1, from + 1)
      state.laneSwitchRemaining = LANE_SWITCH_TICKS
    }
  }
}

export function stepRun(course: Course, state: RunState, actions: InputAction[]): void {
  if (state.status !== 'running') {
    return
  }

  applyActions(state, actions)

  const speed = Math.min(MAX_SPEED, INITIAL_SPEED + ACCELERATION * state.tick * SECONDS_PER_TICK)
  const previousDistance = state.distance
  state.distance += speed * SECONDS_PER_TICK

  if (state.laneSwitchRemaining > 0) {
    state.laneSwitchRemaining -= 1
    if (state.laneSwitchRemaining === 0) {
      state.laneIndex = state.laneTarget
    }
  }

  const airborne = state.tick < state.airborneUntil
  const sliding = state.tick < state.slidingUntil

  for (let i = 0; i < course.segments.length; i += 1) {
    if (state.passed[i]) {
      continue
    }
    const segment = course.segments[i]
    const failure = evaluateSegment(segment, i, {
      tick: state.tick,
      previousDistance,
      distance: state.distance,
      laneIndex: state.laneIndex,
      airborne,
      sliding,
    })
    if (failure) {
      state.status = 'failed'
      state.failure = failure
      return
    }
    if (segment.type === 'coin_row') {
      const coinLane = laneNameToIndex(segment.lane ?? 'center')
      if (previousDistance < segment.distance && state.distance >= segment.distance && coinLane === state.laneIndex) {
        state.coinsCollected += 1
      }
    }
    if (segmentPassed(segment, previousDistance, state.distance)) {
      state.passed[i] = true
    }
  }

  if (state.distance >= course.finish_distance) {
    state.status = 'finished'
    return
  }

  state.tick += 1
}

export function simulate(course: Course, inputLog: InputLog): RunResult {
  const actionsByTick = new Map<number, InputAction[]>()
  for (const event of inputLog) {
    const list = actionsByTick.get(event.tick)
    if (list) {
      list.push(event.action)
    } else {
      actionsByTick.set(event.tick, [event.action])
    }
  }

  const state = createRunState(course)
  while (state.status === 'running' && state.tick < MAX_RUN_TICKS) {
    stepRun(course, state, actionsByTick.get(state.tick) ?? [])
  }

  if (state.status === 'running') {
    state.status = 'failed'
    state.failure = { tick: state.tick, distance: state.distance, segment_index: -1 }
  }

  return {
    completed: state.status === 'finished',
    time_ms: (state.tick + 1) * TICK_MS,
    coins_collected: state.coinsCollected,
    distance: state.distance,
    failure: state.failure,
  }
}

interface FrameState {
  tick: number
  previousDistance: number
  distance: number
  laneIndex: number
  airborne: boolean
  sliding: boolean
}

function evaluateSegment(
  segment: Course['segments'][number],
  index: number,
  frame: FrameState,
): RunFailure | null {
  const crossed = frame.previousDistance < segment.distance && frame.distance >= segment.distance

  if (segment.type === 'gap') {
    const start = segment.distance
    const end = start + (segment.width ?? 0)
    if (crossed && !frame.airborne) {
      return { tick: frame.tick, distance: frame.distance, segment_index: index }
    }
    if (frame.distance > start && frame.distance < end && !frame.airborne) {
      return { tick: frame.tick, distance: frame.distance, segment_index: index }
    }
    return null
  }

  if (!crossed) {
    return null
  }

  const requirement = barrierRequirement(segment)
  if (requirement === 'jump' && !frame.airborne) {
    return { tick: frame.tick, distance: frame.distance, segment_index: index }
  }
  if (requirement === 'slide' && !frame.sliding) {
    return { tick: frame.tick, distance: frame.distance, segment_index: index }
  }

  const blockingLane = blockingLaneIndex(segment, frame.tick)
  if (blockingLane !== null && blockingLane === frame.laneIndex) {
    return { tick: frame.tick, distance: frame.distance, segment_index: index }
  }

  return null
}

function segmentPassed(
  segment: Course['segments'][number],
  previousDistance: number,
  distance: number,
): boolean {
  if (segment.type === 'gap') {
    return distance >= segment.distance + (segment.width ?? 0)
  }
  return previousDistance < segment.distance && distance >= segment.distance
}
