export const TICK_MS = 10
export const SECONDS_PER_TICK = TICK_MS / 1000

export const LANE_COUNT = 3
export const LANE_WIDTH = 2
export const LANE_OFFSETS = [-LANE_WIDTH, 0, LANE_WIDTH] as const

export const INITIAL_SPEED = 8
export const ACCELERATION = 0.15
export const MAX_SPEED = 20

export const JUMP_TICKS = 60
export const SLIDE_TICKS = 50
export const LANE_SWITCH_TICKS = 25

export const JUMP_SECONDS = JUMP_TICKS * SECONDS_PER_TICK
export const SLIDE_SECONDS = SLIDE_TICKS * SECONDS_PER_TICK

export const COIN_VALUE = 10

export const COIN_ROW_OFFSETS = [-1.2, 0, 1.2] as const

export const GAP_LANDING_TOLERANCE = 0.5

export const MAX_INPUT_LOG_BYTES = 256 * 1024

export const MAX_RUN_TICKS = 120000
