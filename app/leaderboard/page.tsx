'use client'

import { useEffect, useState } from 'react'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { formatTime, shortenAddress } from '@/lib/util/format'

interface DailyEntry {
  rank: number
  wallet_address: string
  best_time_ms: number
  best_score: number
}

interface SeasonEntry {
  rank: number
  wallet_address: string
  points: number
  reward_amount: number
}

type LoadState = 'loading' | 'ready' | 'error'
type SeasonState = 'loading' | 'ready' | 'not-found' | 'error'

function yesterdayIso(): string {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() - 1)
  return date.toISOString().slice(0, 10)
}

async function fetchDaily(date?: string): Promise<DailyEntry[]> {
  const query = date ? `?date=${date}` : ''
  const response = await fetch(`/api/leaderboard/daily${query}`)
  if (!response.ok) {
    throw new Error('failed')
  }
  const body = (await response.json()) as { entries?: DailyEntry[] }
  return body.entries ?? []
}

export default function LeaderboardPage() {
  const online = useOnlineStatus()
  const [todayState, setTodayState] = useState<LoadState>('loading')
  const [yesterdayState, setYesterdayState] = useState<LoadState>('loading')
  const [todayEntries, setTodayEntries] = useState<DailyEntry[]>([])
  const [yesterdayEntries, setYesterdayEntries] = useState<DailyEntry[]>([])
  const [seasonState, setSeasonState] = useState<SeasonState>('loading')
  const [seasonLabel, setSeasonLabel] = useState('')
  const [seasonEntries, setSeasonEntries] = useState<SeasonEntry[]>([])

  useEffect(() => {
    let active = true
    const yesterday = yesterdayIso()

    fetchDaily()
      .then((entries) => {
        if (active) {
          setTodayEntries(entries)
          setTodayState('ready')
        }
      })
      .catch(() => active && setTodayState('error'))

    fetchDaily(yesterday)
      .then((entries) => {
        if (active) {
          setYesterdayEntries(entries)
          setYesterdayState('ready')
        }
      })
      .catch(() => active && setYesterdayState('error'))

    fetch('/api/leaderboard/season')
      .then(async (response) => {
        if (response.status === 404) {
          return null
        }
        if (!response.ok) {
          throw new Error('failed')
        }
        return (await response.json()) as { season_label: string; entries?: SeasonEntry[] }
      })
      .then((body) => {
        if (!active) {
          return
        }
        if (!body) {
          setSeasonState('not-found')
          return
        }
        setSeasonLabel(body.season_label)
        setSeasonEntries(body.entries ?? [])
        setSeasonState('ready')
      })
      .catch(() => active && setSeasonState('error'))

    return () => {
      active = false
    }
  }, [])

  return (
    <div className="min-h-dvh text-bone">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-16">
        <h1 className="font-display text-[40px] leading-none text-bone max-lg:text-[32px]">
          Leaderboard
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ash">
          Ranked by finish time. Only verified runs appear here.
        </p>

        {!online && (
          <p className="mt-4 rounded-nav border border-frost/50 px-4 py-2 font-mono text-[11px] uppercase tracking-[-0.02em] text-error">
            Connection lost
          </p>
        )}

        <section data-section="leaderboard-daily" className="mt-10">
          <h2 className="font-display text-[24px] leading-none text-bone">Daily</h2>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <DailyBlock title="Today" state={todayState} entries={todayEntries} />
            <DailyBlock title="Yesterday" state={yesterdayState} entries={yesterdayEntries} />
          </div>
        </section>

        <section data-section="leaderboard-season" className="mt-14">
          <h2 className="font-display text-[24px] leading-none text-bone">Seasoned</h2>
          <SeasonBlock
            state={seasonState}
            label={seasonLabel}
            entries={seasonEntries}
          />
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}

function DailyBlock({
  title,
  state,
  entries,
}: {
  title: string
  state: LoadState
  entries: DailyEntry[]
}) {
  return (
    <article className="rounded-card border border-frost/50 bg-charcoal p-6 shadow-card">
      <h3 className="font-mono text-[11px] uppercase tracking-[-0.02em] text-accent-soft">
        {title}
      </h3>
      {state === 'loading' && (
        <p className="mt-4 font-mono text-[12px] uppercase tracking-[-0.02em] text-ash">
          Loading ranking
        </p>
      )}
      {state === 'error' && (
        <p className="mt-4 text-[14px] text-error">This ranking could not be loaded.</p>
      )}
      {state === 'ready' && entries.length === 0 && (
        <p className="mt-4 text-[14px] text-ash">No verified runs yet.</p>
      )}
      {state === 'ready' && entries.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-frost/50 font-mono text-[10px] uppercase tracking-[-0.02em] text-ash">
                <th className="py-2 pr-4">Rank</th>
                <th className="py-2 pr-4">Wallet</th>
                <th className="py-2 pr-4">Time</th>
                <th className="py-2">Score</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr
                  key={entry.wallet_address}
                  className="border-b border-frost/30 font-mono text-[12px] text-bone"
                >
                  <td className="py-2 pr-4 text-accent-amber">
                    {String(entry.rank).padStart(2, '0')}
                  </td>
                  <td className="py-2 pr-4 text-ash">{shortenAddress(entry.wallet_address)}</td>
                  <td className="py-2 pr-4 text-accent-teal">{formatTime(entry.best_time_ms)}</td>
                  <td className="py-2">{entry.best_score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  )
}

function SeasonBlock({
  state,
  label,
  entries,
}: {
  state: SeasonState
  label: string
  entries: SeasonEntry[]
}) {
  return (
    <article className="mt-5 rounded-card border border-frost/50 bg-charcoal p-6 shadow-card">
      {state === 'loading' && (
        <p className="font-mono text-[12px] uppercase tracking-[-0.02em] text-ash">
          Loading season
        </p>
      )}
      {state === 'not-found' && <p className="text-[14px] text-ash">No active season yet.</p>}
      {state === 'error' && <p className="text-[14px] text-error">The season could not be loaded.</p>}
      {state === 'ready' && (
        <>
          <p className="font-mono text-[11px] uppercase tracking-[-0.02em] text-accent-teal">
            {label}
          </p>
          {entries.length === 0 ? (
            <p className="mt-4 text-[14px] text-ash">
              No relayed runs yet this season, so no points have been earned.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-frost/50 font-mono text-[10px] uppercase tracking-[-0.02em] text-ash">
                    <th className="py-2 pr-4">Rank</th>
                    <th className="py-2 pr-4">Wallet</th>
                    <th className="py-2 pr-4">Points</th>
                    <th className="py-2">Reward</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr
                      key={entry.wallet_address}
                      className="border-b border-frost/30 font-mono text-[12px] text-bone"
                    >
                      <td className="py-2 pr-4 text-accent-amber">
                        {String(entry.rank).padStart(2, '0')}
                      </td>
                      <td className="py-2 pr-4 text-ash">{shortenAddress(entry.wallet_address)}</td>
                      <td className="py-2 pr-4">{entry.points}</td>
                      <td className="py-2 text-accent-teal">{entry.reward_amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </article>
  )
}
