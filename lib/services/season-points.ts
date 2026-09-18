export const SEASON_POINTS = [40, 36, 32, 28, 24, 20, 16, 12, 8, 1] as const

export function pointsForRank(rank: number): number {
  if (rank < 1 || rank > SEASON_POINTS.length) {
    return 0
  }
  return SEASON_POINTS[rank - 1]
}
