'use client'

import { useCallback, useEffect, useState } from 'react'
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

interface SeasonMeta {
  page: number
  total_pages: number
  total: number
  has_next: boolean
  wallet_address: string | null
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

interface SeasonPayload {
  season_label: string
  entries: SeasonEntry[]
  meta: SeasonMeta
}

async function fetchSeason(page: number): Promise<SeasonPayload | null> {
  const response = await fetch(`/api/leaderboard/season?page=${page}`)
  if (response.status === 404) {
    return null
  }
  if (!response.ok) {
    throw new Error('failed')
  }
  return (await response.json()) as SeasonPayload
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
  const [seasonMeta, setSeasonMeta] = useState<SeasonMeta | null>(null)
  const [seasonPage, setSeasonPage] = useState(1)

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

    return () => {
      active = false
    }
  }, [])

  const loadSeason = useCallback((page: number) => {
    let active = true
    fetchSeason(page)
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
        setSeasonMeta(body.meta)
        setSeasonState('ready')
      })
      .catch(() => active && setSeasonState('error'))
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const cancel = loadSeason(seasonPage)
    return cancel
  }, [loadSeason, seasonPage])

  // True while the requested page is still in flight, so the pager cannot be spammed.
  const seasonBusy = seasonMeta !== null && seasonMeta.page !== seasonPage

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
          <div className="mt-5">
            <DailyBoards
              todayState={todayState}
              todayEntries={todayEntries}
              yesterdayState={yesterdayState}
              yesterdayEntries={yesterdayEntries}
            />
          </div>
        </section>

        <section data-section="leaderboard-season" className="mt-14">
          <h2 className="font-display text-[24px] leading-none text-bone">Seasoned</h2>
          <SeasonBlock
            state={seasonState}
            label={seasonLabel}
            entries={seasonEntries}
            meta={seasonMeta}
            busy={seasonBusy}
            onSelectPage={setSeasonPage}
          />
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}

function DailyBoards({
  todayState,
  todayEntries,
  yesterdayState,
  yesterdayEntries,
}: {
  todayState: LoadState
  todayEntries: DailyEntry[]
  yesterdayState: LoadState
  yesterdayEntries: DailyEntry[]
}) {
  return (
    <article className="overflow-hidden rounded-card border border-frost/50 bg-charcoal shadow-card">
      <div className="grid divide-y divide-frost/40 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
        <DailyBoard title="Today" state={todayState} entries={todayEntries} />
        <DailyBoard title="Yesterday" state={yesterdayState} entries={yesterdayEntries} />
      </div>
    </article>
  )
}

function DailyBoard({
  title,
  state,
  entries,
}: {
  title: string
  state: LoadState
  entries: DailyEntry[]
}) {
  return (
    <div className="p-6">
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
    </div>
  )
}

function SeasonBlock({
  state,
  label,
  entries,
  meta,
  busy,
  onSelectPage,
}: {
  state: SeasonState
  label: string
  entries: SeasonEntry[]
  meta: SeasonMeta | null
  busy: boolean
  onSelectPage: (page: number) => void
}) {
  const wallet = meta?.wallet_address?.toLowerCase() ?? null

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
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <p className="font-mono text-[11px] uppercase tracking-[-0.02em] text-accent-teal">
              {label}
            </p>
            {meta && meta.total > 0 && (
              <p className="font-mono text-[10px] uppercase tracking-[-0.02em] text-ash">
                Page {meta.page} of {meta.total_pages} · {meta.total} ranked wallets
              </p>
            )}
          </div>
          {entries.length === 0 ? (
            <p className="mt-4 text-[14px] text-ash">
              No verified runs yet this season, so no points have been earned.
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
                  {entries.map((entry) => {
                    const isSelf = wallet !== null && entry.wallet_address.toLowerCase() === wallet
                    return (
                      <tr
                        key={entry.wallet_address}
                        aria-current={isSelf ? 'true' : undefined}
                        className={`border-b border-frost/30 font-mono text-[12px] ${
                          isSelf ? 'bg-accent-primary/15 text-bone' : 'text-bone'
                        }`}
                      >
                        <td className="py-2 pr-4 text-accent-amber">
                          {String(entry.rank).padStart(2, '0')}
                        </td>
                        <td className={`py-2 pr-4 ${isSelf ? 'text-bone' : 'text-ash'}`}>
                          {shortenAddress(entry.wallet_address)}
                          {isSelf && <span className="ml-2 text-accent-soft">(you)</span>}
                        </td>
                        <td className="py-2 pr-4">{entry.points}</td>
                        <td className="py-2 text-accent-teal">
                          {entry.reward_amount > 0 ? entry.reward_amount.toFixed(2) : '0'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          {meta && (
            <SeasonPager
              page={meta.page}
              totalPages={meta.total_pages}
              busy={busy}
              onSelect={onSelectPage}
            />
          )}
        </>
      )}
    </article>
  )
}

function SeasonPager({
  page,
  totalPages,
  busy,
  onSelect,
}: {
  page: number
  totalPages: number
  busy: boolean
  onSelect: (page: number) => void
}) {
  if (totalPages <= 1) {
    return null
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)
  const stepClass =
    'inline-flex h-11 min-w-11 items-center justify-center rounded-nav border border-frost px-3 font-mono text-[12px] text-bone transition-colors duration-200 hover:border-bone disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary'

  return (
    <nav
      data-section="leaderboard-season-pager"
      aria-label="Season leaderboard pages"
      className="mt-5 flex flex-wrap items-center gap-2"
    >
      <button
        type="button"
        onClick={() => onSelect(page - 1)}
        disabled={busy || page <= 1}
        className={stepClass}
      >
        Previous
      </button>
      <ul className="flex items-center gap-2">
        {pages.map((number) => {
          const current = number === page
          return (
            <li key={number}>
              <button
                type="button"
                onClick={() => onSelect(number)}
                disabled={busy}
                aria-current={current ? 'page' : undefined}
                aria-label={`Page ${number}`}
                className={
                  current
                    ? 'inline-flex h-11 w-11 items-center justify-center rounded-nav bg-accent-primary font-mono text-[12px] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary'
                    : 'inline-flex h-11 w-11 items-center justify-center rounded-nav border border-frost font-mono text-[12px] text-bone transition-colors duration-200 hover:border-bone disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary'
                }
              >
                {number}
              </button>
            </li>
          )
        })}
      </ul>
      <button
        type="button"
        onClick={() => onSelect(page + 1)}
        disabled={busy || page >= totalPages}
        className={stepClass}
      >
        Next
      </button>
    </nav>
  )
}
