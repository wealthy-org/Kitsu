import { generateCourse } from '@/sim/course-generator'
import { simulate } from '@/sim/run'
import { scoreFromCoins } from '@/sim/scoring'
import type { Course, InputLog } from '@/sim/types'

export interface VerifyRunResult {
  verified: boolean
  completed: boolean
  time_ms: number | null
  coins_collected: number
  score: number
}

export function verifyRunResult(course: Course, inputLog: InputLog): VerifyRunResult {
  const result = simulate(course, inputLog)
  if (!result.completed) {
    return { verified: false, completed: false, time_ms: null, coins_collected: 0, score: 0 }
  }
  return {
    verified: true,
    completed: true,
    time_ms: result.time_ms,
    coins_collected: result.coins_collected,
    score: scoreFromCoins(result.coins_collected),
  }
}

export function verifyRun(dailySeed: string, inputLog: InputLog): VerifyRunResult {
  return verifyRunResult(generateCourse(dailySeed), inputLog)
}
