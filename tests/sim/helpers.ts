import {
  ACCELERATION,
  INITIAL_SPEED,
  MAX_SPEED,
  SECONDS_PER_TICK,
} from '@/sim/constants'

export function tickAtDistance(distance: number): number {
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
