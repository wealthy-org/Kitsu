import { describe, expect, it } from 'vitest'
import { computeSeasonBoard, computeSeasonStandings } from '@/lib/services/season-reward.service'

describe('computeSeasonBoard', () => {
  it('ranks the live board from provisional runs but keeps rewards on confirmed runs only', () => {
    const provisional = [
      { courseDate: '2026-09-01', walletAddress: '0xaa', bestScore: 2500 },
      { courseDate: '2026-09-01', walletAddress: '0xbb', bestScore: 1000 },
    ]
    const confirmed = [
      { courseDate: '2026-09-01', walletAddress: '0xbb', bestScore: 800 },
    ]

    const { entries } = computeSeasonBoard({ provisional, confirmed, pool: 1000 })

    expect(entries.map((entry) => entry.walletAddress)).toEqual(['0xaa', '0xbb'])
    expect(entries[0]).toMatchObject({ rank: 1, points: 2500, rewardAmount: 0 })
    expect(entries[1]).toMatchObject({ rank: 2, points: 1000, rewardAmount: 1000 })
  })

  it('falls back to zero rewards when the pool is zero', () => {
    const { entries } = computeSeasonBoard({
      provisional: [{ courseDate: '2026-09-01', walletAddress: '0xaa', bestScore: 900 }],
      confirmed: [{ courseDate: '2026-09-01', walletAddress: '0xaa', bestScore: 900 }],
      pool: 0,
    })
    expect(entries[0].rewardAmount).toBe(0)
  })
})

describe('computeSeasonStandings', () => {
  it('splits the pool over the top ten winners only', () => {
    const rows = Array.from({ length: 12 }, (_, index) => ({
      courseDate: '2026-09-01',
      walletAddress: `0x${index.toString().padStart(2, '0')}`,
      bestScore: 1000 - index * 10,
    }))
    const { entries, totalPoints } = computeSeasonStandings(rows, 500)

    expect(entries).toHaveLength(12)
    expect(totalPoints).toBe(entries.slice(0, 10).reduce((sum, entry) => sum + entry.points, 0))
    expect(entries.slice(0, 10).every((entry) => entry.rewardAmount > 0)).toBe(true)
    expect(entries.slice(10).every((entry) => entry.rewardAmount === 0)).toBe(true)
  })
})
