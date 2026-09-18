import { z } from 'zod'
import { INPUT_ACTIONS } from '@/sim/types'

export const inputEventSchema = z.object({
  tick: z.number().int().nonnegative(),
  action: z.enum(INPUT_ACTIONS),
})

export const verifyRunSchema = z.object({
  daily_seed: z.string().min(1).max(64),
  input_log: z.array(inputEventSchema),
})

export type VerifyRunInput = z.infer<typeof verifyRunSchema>

export function inputLogByteSize(inputLog: unknown): number {
  return Buffer.byteLength(JSON.stringify(inputLog ?? null), 'utf8')
}
