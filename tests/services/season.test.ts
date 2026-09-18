import { describe, expect, it } from 'vitest'
import { SEASON_POINTS, pointsForRank } from '@/lib/services/season-points'
import { computeStandings } from '@/lib/services/season-reward.service'

describe('season points', () => {
  it('maps ranks 1 to 10 to the confirmed scale', () => {
    expect([...SEASON_POINTS]).toEqual([40, 36, 32, 28, 24, 20, 16, 12, 8, 1])
    expect(pointsForRank(1)).toBe(40)
    expect(pointsForRank(10)).toBe(1)
  })

  it('gives no points outside the top ten', () => {
    expect(pointsForRank(0)).toBe(0)
    expect(pointsForRank(11)).toBe(0)
  })
})

describe('season standings', () => {
  it('ranks by aggregated daily points and splits the pool proportionally', () => {
    const rows = [
      { courseDate: '2026-09-01', walletAddress: '0xa', bestTimeMs: 1000 },
      { courseDate: '2026-09-01', walletAddress: '0xb', bestTimeMs: 2000 },
      { courseDate: '2026-09-02', walletAddress: '0xb', bestTimeMs: 500 },
      { courseDate: '2026-09-02', walletAddress: '0xa', bestTimeMs: 1500 },
    ]
    const { entries, totalPoints } = computeStandings(rows, 100)

    expect(totalPoints).toBe(152)
    expect(entries).toHaveLength(2)
    expect(entries[0].points + entries[1].points).toBe(152)
    const rewardSum = entries.reduce((sum, entry) => sum + entry.rewardAmount, 0)
    expect(Math.round(rewardSum)).toBe(100)
  })

  it('counts only the top ten of each day', () => {
    const rows = Array.from({ length: 12 }, (_, index) => ({
      courseDate: '2026-09-03',
      walletAddress: `0x${index}`,
      bestTimeMs: 1000 + index,
    }))
    const { entries, totalPoints } = computeStandings(rows, 0)
    expect(entries).toHaveLength(10)
    expect(totalPoints).toBe(SEASON_POINTS.reduce((sum, points) => sum + points, 0))
  })

  it('returns zero rewards when the pool is zero', () => {
    const { entries } = computeStandings(
      [{ courseDate: '2026-09-01', walletAddress: '0xa', bestTimeMs: 1000 }],
      0,
    )
    expect(entries[0].rewardAmount).toBe(0)
  })
})
