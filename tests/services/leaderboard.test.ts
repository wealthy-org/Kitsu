import { describe, expect, it } from 'vitest'
import { computeRank } from '@/lib/repositories/leaderboard.repository'

describe('leaderboard ranking', () => {
  it('assigns sequential ranks in order', () => {
    expect(computeRank([{ best_time_ms: 100 }, { best_time_ms: 200 }, { best_time_ms: 300 }])).toEqual([
      1, 2, 3,
    ])
  })

  it('returns an empty list for no entries', () => {
    expect(computeRank([])).toEqual([])
  })
})
