import { describe, expect, it } from 'vitest'
import {
  SEASON_LENGTH_DAYS,
  firstSeasonWindow,
  nextSeasonLabel,
  nextSeasonWindow,
} from '@/lib/services/season.service'

describe('nextSeasonLabel', () => {
  it('increments and keeps the padding', () => {
    expect(nextSeasonLabel('Season 01', '2026-10-01')).toBe('Season 02')
    expect(nextSeasonLabel('Season 09', '2026-10-01')).toBe('Season 10')
    expect(nextSeasonLabel('Season 99', '2026-10-01')).toBe('Season 100')
  })

  it('falls back to a dated label when there is no number', () => {
    expect(nextSeasonLabel('Season', '2026-10-01')).toBe('Season 2026-10')
  })
})

describe('nextSeasonWindow', () => {
  it('starts the day after the previous season and lasts 30 days', () => {
    const window = nextSeasonWindow({ label: 'Season 01', endDate: '2026-09-30' }, '2026-10-01')
    expect(window.startDate).toBe('2026-10-01')
    expect(window.endDate).toBe('2026-10-30')
    expect(window.label).toBe('Season 02')
  })

  it('does not start before today when the rollover runs late', () => {
    const window = nextSeasonWindow({ label: 'Season 01', endDate: '2026-09-30' }, '2026-10-05')
    expect(window.startDate).toBe('2026-10-05')
    expect(window.endDate).toBe('2026-11-03')
  })

  it('handles month and year boundaries', () => {
    const window = nextSeasonWindow({ label: 'Season 11', endDate: '2026-12-31' }, '2027-01-01')
    expect(window.startDate).toBe('2027-01-01')
    expect(window.endDate).toBe('2027-01-30')
  })

  it('keeps the season length constant', () => {
    const window = nextSeasonWindow({ label: 'Season 01', endDate: '2026-09-30' }, '2026-10-01')
    const days =
      (Date.parse(`${window.endDate}T00:00:00Z`) - Date.parse(`${window.startDate}T00:00:00Z`)) /
        86400000 +
      1
    expect(days).toBe(SEASON_LENGTH_DAYS)
  })
})

describe('firstSeasonWindow', () => {
  it('starts the first season today and runs for 30 days', () => {
    const window = firstSeasonWindow('2026-09-22')
    expect(window).toEqual({
      label: 'Season 01',
      startDate: '2026-09-22',
      endDate: '2026-10-21',
    })
  })
})
