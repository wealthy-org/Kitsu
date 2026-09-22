import type { SeasonBestRow } from '@/lib/repositories/season.repository'

export const REWARD_WINNER_COUNT = 10

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

function sumByWallet(rows: SeasonBestRow[]): Map<string, number> {
  const pointsByWallet = new Map<string, number>()
  for (const row of rows) {
    pointsByWallet.set(row.walletAddress, (pointsByWallet.get(row.walletAddress) ?? 0) + row.bestScore)
  }
  return pointsByWallet
}

function rankWallets(pointsByWallet: Map<string, number>): [string, number][] {
  return [...pointsByWallet.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
}

// A wallet's season points are the sum of its daily best verified scores (the repository returns one
// row per wallet per day). The pool is split proportionally among the top ten winners, so rank 1
// always receives the largest reward.
export function computeSeasonStandings(rows: SeasonBestRow[], pool: number): SeasonStandings {
  const sorted = rankWallets(sumByWallet(rows))
  const winners = sorted.slice(0, REWARD_WINNER_COUNT)
  const totalPoints = winners.reduce((sum, [, points]) => sum + points, 0)

  const entries = sorted.map(([walletAddress, points], index) => ({
    rank: index + 1,
    walletAddress,
    points,
    rewardAmount:
      index < REWARD_WINNER_COUNT && totalPoints > 0 && pool > 0
        ? (pool * points) / totalPoints
        : 0,
  }))

  return { entries, totalPoints }
}

// The board shows verified runs too, so a player sees their position the moment a run is verified.
// Rewards stay tied to relayed runs only (PROJECT.md 8.2, BR-15), so they are computed from the
// confirmed set and merged onto the provisional board.
export function computeSeasonBoard(input: {
  provisional: SeasonBestRow[]
  confirmed: SeasonBestRow[]
  pool: number
}): SeasonStandings {
  const board = computeSeasonStandings(input.provisional, 0)
  const confirmed = computeSeasonStandings(input.confirmed, input.pool)
  const rewardByWallet = new Map(
    confirmed.entries
      .filter((entry) => entry.rewardAmount > 0)
      .map((entry) => [entry.walletAddress, entry.rewardAmount]),
  )

  return {
    entries: board.entries.map((entry) => ({
      ...entry,
      rewardAmount: rewardByWallet.get(entry.walletAddress) ?? 0,
    })),
    totalPoints: board.totalPoints,
  }
}
