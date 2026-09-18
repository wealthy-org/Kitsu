export function todayIso(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10)
}

export function yesterdayIso(now: Date = new Date()): string {
  return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
}
