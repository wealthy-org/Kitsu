import {
  createSeason,
  getActiveSeason,
  getEarliestRunDate,
  getSeasonEndingBefore,
  type SeasonRow,
} from '@/lib/repositories/season.repository'
import { todayIso } from '@/lib/util/date'

export const SEASON_LENGTH_DAYS = 30
export const FIRST_SEASON_LABEL = 'Season 01'
const DAY_MS = 24 * 60 * 60 * 1000

export interface SeasonWindow {
  label: string
  startDate: string
  endDate: string
}

export interface SeasonRolloverResult {
  status: 'created' | 'no_change' | 'bootstrapped'
  seasonLabel: string
  startDate: string
  endDate: string
}

function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day) + days * DAY_MS).toISOString().slice(0, 10)
}

export function nextSeasonLabel(previousLabel: string, startDate: string): string {
  const match = previousLabel.match(/^(.*?)(\d+)\s*$/)
  if (!match) {
    return `${previousLabel} ${startDate.slice(0, 7)}`
  }
  const [, prefix, digits] = match
  const next = String(Number(digits) + 1).padStart(digits.length, '0')
  return `${prefix}${next}`
}

export function nextSeasonWindow(
  previous: Pick<SeasonRow, 'label' | 'endDate'>,
  today: string,
): SeasonWindow {
  const afterPrevious = addDays(previous.endDate, 1)
  const startDate = afterPrevious > today ? afterPrevious : today
  return {
    label: nextSeasonLabel(previous.label, startDate),
    startDate,
    endDate: addDays(startDate, SEASON_LENGTH_DAYS - 1),
  }
}

export function firstSeasonWindow(today: string): SeasonWindow {
  return {
    label: FIRST_SEASON_LABEL,
    startDate: today,
    endDate: addDays(today, SEASON_LENGTH_DAYS - 1),
  }
}

// Returns the season that covers today, creating one when the table has none (or when the previous
// season has ended and the cron has not run yet). The first season starts at the earliest eligible
// run so existing verified runs are not left out of an empty board. Idempotent, so reads can rely on
// it.
export async function ensureActiveSeason(today: string = todayIso()): Promise<SeasonRow> {
  const active = await getActiveSeason(today)
  if (active) {
    return active
  }

  const previous = await getSeasonEndingBefore(today)
  const window = previous
    ? nextSeasonWindow(previous, today)
    : firstSeasonWindow(await firstSeasonStart(today))
  return createSeason({ ...window, pool: '0' })
}

async function firstSeasonStart(today: string): Promise<string> {
  const earliest = await getEarliestRunDate()
  if (!earliest) {
    return today
  }
  const earliestDate = earliest.slice(0, 10)
  return earliestDate < today ? earliestDate : today
}

// Keeps the season series going: bootstraps the first season, otherwise starts the next one once the
// active season's end date has passed. Safe to run on every schedule tick.
export async function runSeasonRollover(now: Date = new Date()): Promise<SeasonRolloverResult> {
  const today = todayIso(now)
  const active = await getActiveSeason(today)

  if (active) {
    return {
      status: 'no_change',
      seasonLabel: active.label,
      startDate: active.startDate,
      endDate: active.endDate,
    }
  }

  const previous = await getSeasonEndingBefore(today)
  const season = await ensureActiveSeason(today)

  return {
    status: previous ? 'created' : 'bootstrapped',
    seasonLabel: season.label,
    startDate: season.startDate,
    endDate: season.endDate,
  }
}
