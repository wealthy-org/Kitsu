import { countRunsForWalletDate } from '@/lib/repositories/run.repository'

export const MAX_DAILY_SUBMITS = 5

export async function countDailySubmissions(wallet: string, courseDate: string): Promise<number> {
  return countRunsForWalletDate(wallet, courseDate)
}
