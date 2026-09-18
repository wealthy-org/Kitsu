import type { RelayedBestRow } from '@/lib/repositories/season.repository'
import { pointsForRank } from '@/lib/services/season-points'

export interface SeasonStanding {
  rank: number
  walletAddress: string
  points: number
  rewardAmount: number
}

export interface SeasonStandings {
  entries: SeasonStanding[]
  totalPoints: number
}

export function computeStandings(rows: RelayedBestRow[], pool: number): SeasonStandings {
  const byDate = new Map<string, RelayedBestRow[]>()
  for (const row of rows) {
    const list = byDate.get(row.courseDate)
    if (list) {
      list.push(row)
    } else {
      byDate.set(row.courseDate, [row])
    }
  }

  const pointsByWallet = new Map<string, number>()
  for (const list of byDate.values()) {
    const sorted = [...list].sort((a, b) => a.bestTimeMs - b.bestTimeMs)
    sorted.forEach((row, index) => {
      const points = pointsForRank(index + 1)
      if (points > 0) {
        pointsByWallet.set(row.walletAddress, (pointsByWallet.get(row.walletAddress) ?? 0) + points)
      }
    })
  }

  const totalPoints = [...pointsByWallet.values()].reduce((sum, points) => sum + points, 0)
  const entries = [...pointsByWallet.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([walletAddress, points], index) => ({
      rank: index + 1,
      walletAddress,
      points,
      rewardAmount: totalPoints > 0 && pool > 0 ? (pool * points) / totalPoints : 0,
    }))

  return { entries, totalPoints }
}
