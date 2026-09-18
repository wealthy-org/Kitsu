'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatTime } from '@/lib/util/format'

interface Entry {
  rank: number
  wallet_address: string
  best_time_ms: number
  best_score: number
}

type LoadState = 'loading' | 'ready' | 'error'

function shorten(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export default function LeaderboardPage() {
  const [state, setState] = useState<LoadState>('loading')
  const [entries, setEntries] = useState<Entry[]>([])

  useEffect(() => {
    let active = true
    fetch('/api/leaderboard/daily')
      .then((response) => {
        if (!response.ok) {
          throw new Error('failed')
        }
        return response.json() as Promise<{ entries?: Entry[] }>
      })
      .then((body) => {
        if (!active) {
          return
        }
        setEntries(body.entries ?? [])
        setState('ready')
      })
      .catch(() => {
        if (active) {
          setState('error')
        }
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <main className="min-h-dvh bg-void px-6 py-16 text-bone">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="font-mono text-[11px] uppercase tracking-[-0.02em] text-accent-teal underline-offset-4 hover:underline"
        >
          Kitsu
        </Link>
        <h1 className="mt-6 font-display text-[48px] leading-none text-bone max-lg:text-[36px]">
          <span className="text-accent-teal">Daily</span> leaderboard
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-ash">
          Ranked by finish time. Only verified runs appear here.
        </p>

        <div className="mt-8">
          {state === 'loading' && (
            <p className="font-mono text-[12px] uppercase tracking-[-0.02em] text-ash">
              Loading ranking
            </p>
          )}

          {state === 'error' && (
            <p className="text-[15px] text-error">
              The leaderboard could not be loaded. Please try again later.
            </p>
          )}

          {state === 'ready' && entries.length === 0 && (
            <p className="text-[15px] text-ash">
              No verified runs yet today. Play a practice run and submit the first one.
            </p>
          )}

          {state === 'ready' && entries.length > 0 && (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-frost/15 font-mono text-[10px] uppercase tracking-[-0.02em] text-ash">
                  <th className="py-2 pr-4">Rank</th>
                  <th className="py-2 pr-4">Wallet</th>
                  <th className="py-2 pr-4">Time</th>
                  <th className="py-2">Coins score</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr
                    key={entry.wallet_address}
                    className="border-b border-frost/10 font-mono text-[12px] text-bone"
                  >
                    <td className="py-2 pr-4 text-accent-amber">{String(entry.rank).padStart(2, '0')}</td>
                    <td className="py-2 pr-4">{shorten(entry.wallet_address)}</td>
                    <td className="py-2 pr-4 text-accent-teal">{formatTime(entry.best_time_ms)}</td>
                    <td className="py-2 text-accent-amber">{entry.best_score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  )
}
