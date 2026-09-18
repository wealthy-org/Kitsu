export const OBSTACLE_TYPES = [
  'barrier_high',
  'barrier_low',
  'lane_block',
  'gap',
  'moving_obstacle',
  'coin_row',
] as const

export type ObstacleType = (typeof OBSTACLE_TYPES)[number]

export type LaneName = 'left' | 'center' | 'right'

export interface CourseSegment {
  distance: number
  type: ObstacleType
  lane?: LaneName
  width?: number
  pattern?: 'swing'
  period_ms?: number
}

export interface Course {
  seed: string
  finish_distance: number
  segments: CourseSegment[]
}

export type InputAction = 'jump' | 'slide' | 'left' | 'right'

export interface InputEvent {
  tick: number
  action: InputAction
}

export type InputLog = InputEvent[]

export interface RunFailure {
  tick: number
  distance: number
  segment_index: number
}

export interface RunResult {
  completed: boolean
  time_ms: number
  coins_collected: number
  distance: number
  failure: RunFailure | null
}
