import { describe, expect, it } from 'vitest'
import { REWARD_WINNER_COUNT, computeSeasonStandings } from '@/lib/services/season-reward.service'

describe('season standings', () => {
  it('sums daily best scores per wallet and ranks by the total', () => {
    const rows = [
      { courseDate: '2026-09-01', walletAddress: '0xa', bestScore: 1000 },
      { courseDate: '2026-09-02', walletAddress: '0xa', bestScore: 1000 },
      { courseDate: '2026-09-03', walletAddress: '0xa', bestScore: 500 },
      { courseDate: '2026-09-01', walletAddress: '0xb', bestScore: 1200 },
      { courseDate: '2026-09-02', walletAddress: '0xb', bestScore: 1000 },
      { courseDate: '2026-09-03', walletAddress: '0xb', bestScore: 100 },
    ]
    const { entries } = computeSeasonStandings(rows, 1000)

    expect(entries).toHaveLength(2)
    expect(entries[0]).toMatchObject({ rank: 1, walletAddress: '0xa', points: 2500 })
    expect(entries[1]).toMatchObject({ rank: 2, walletAddress: '0xb', points: 2300 })
  })

  it('splits the pool proportionally over the winners only', () => {
    const rows = [
      { courseDate: '2026-09-01', walletAddress: '0xa', bestScore: 2500 },
      { courseDate: '2026-09-01', walletAddress: '0xb', bestScore: 1500 },
    ]
    const { entries, totalPoints } = computeSeasonStandings(rows, 1000)

    expect(totalPoints).toBe(4000)
    expect(entries[0].rewardAmount).toBe(625)
    expect(entries[1].rewardAmount).toBe(375)
    expect(entries.reduce((sum, entry) => sum + entry.rewardAmount, 0)).toBe(1000)
  })

  it('gives no reward below the winner count', () => {
    const rows = Array.from({ length: 12 }, (_, index) => ({
      courseDate: '2026-09-01',
      walletAddress: `0x${index.toString().padStart(2, '0')}`,
      bestScore: 100 - index,
    }))
    const { entries } = computeSeasonStandings(rows, 500)

    expect(entries).toHaveLength(12)
    expect(entries.slice(0, REWARD_WINNER_COUNT).every((entry) => entry.rewardAmount > 0)).toBe(true)
    expect(entries.slice(REWARD_WINNER_COUNT).every((entry) => entry.rewardAmount === 0)).toBe(true)
  })

  it('returns zero rewards when the pool is zero', () => {
    const { entries } = computeSeasonStandings(
      [{ courseDate: '2026-09-01', walletAddress: '0xa', bestScore: 1000 }],
      0,
    )
    expect(entries[0].rewardAmount).toBe(0)
  })

  it('breaks ties by wallet address so the order is stable', () => {
    const rows = [
      { courseDate: '2026-09-01', walletAddress: '0xbb', bestScore: 700 },
      { courseDate: '2026-09-01', walletAddress: '0xaa', bestScore: 700 },
    ]
    const { entries } = computeSeasonStandings(rows, 0)
    expect(entries.map((entry) => entry.walletAddress)).toEqual(['0xaa', '0xbb'])
  })
})
