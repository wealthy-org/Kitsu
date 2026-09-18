'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { shortenAddress } from '@/lib/util/format'

interface Entry {
  rank: number
  wallet_address: string
  points: number
  reward_amount: number
}

type LoadState = 'loading' | 'ready' | 'not-found' | 'error'

export default function SeasonPage() {
  const [state, setState] = useState<LoadState>('loading')
  const [label, setLabel] = useState('')
  const [entries, setEntries] = useState<Entry[]>([])
  const online = useOnlineStatus()

  useEffect(() => {
    let active = true
    fetch('/api/leaderboard/season')
      .then(async (response) => {
        if (response.status === 404) {
          if (active) {
            setState('not-found')
          }
          return null
        }
        if (!response.ok) {
          throw new Error('failed')
        }
        return (await response.json()) as { season_label: string; entries?: Entry[] }
      })
      .then((body) => {
        if (!active || !body) {
          return
        }
        setLabel(body.season_label)
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
          Season
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-ash">
          Season points from daily ranks, and the sponsor-funded reward share.
        </p>

        {!online && (
          <p className="mt-4 rounded-nav border border-frost/25 px-4 py-2 font-mono text-[11px] uppercase tracking-[-0.02em] text-error">
            Connection lost
          </p>
        )}

        <div className="mt-8">
          {state === 'loading' && (
            <p className="font-mono text-[12px] uppercase tracking-[-0.02em] text-ash">
              Loading season
            </p>
          )}
          {state === 'not-found' && (
            <p className="text-[15px] text-ash">No active season yet.</p>
          )}
          {state === 'error' && (
            <p className="text-[15px] text-error">The season could not be loaded.</p>
          )}
          {state === 'ready' && (
            <>
              <p className="font-mono text-[11px] uppercase tracking-[-0.02em] text-accent-teal">
                {label}
              </p>
              {entries.length === 0 ? (
                <p className="mt-4 text-[15px] text-ash">
                  No relayed runs yet this season, so no points have been earned.
                </p>
              ) : (
                <table className="mt-4 w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-frost/15 font-mono text-[10px] uppercase tracking-[-0.02em] text-ash">
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
                        className="border-b border-frost/10 font-mono text-[12px] text-bone"
                      >
                        <td className="py-2 pr-4 text-accent-amber">
                          {String(entry.rank).padStart(2, '0')}
                        </td>
                        <td className="py-2 pr-4">{shortenAddress(entry.wallet_address)}</td>
                        <td className="py-2 pr-4">{entry.points}</td>
                        <td className="py-2">{entry.reward_amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  )
}
