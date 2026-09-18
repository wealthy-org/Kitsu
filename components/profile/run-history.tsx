'use client'

import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { formatTime } from '@/components/game/hud'

interface RunRow {
  id: string
  course_date: string
  status: string
  verified_time_ms: number | null
  verified_score: number | null
  onchain_tx_hash: string | null
}

type LoadState = 'loading' | 'ready' | 'unauthenticated' | 'error'

export function RunHistory({ sessionVersion }: { sessionVersion: number }) {
  const { isConnected } = useAccount()
  const [state, setState] = useState<LoadState>('loading')
  const [runs, setRuns] = useState<RunRow[]>([])

  useEffect(() => {
    if (!isConnected) {
      return
    }
    let active = true
    fetch('/api/runs')
      .then((response) => {
        if (response.status === 401) {
          if (active) {
            setState('unauthenticated')
          }
          return null
        }
        if (!response.ok) {
          throw new Error('failed')
        }
        return response.json() as Promise<{ runs?: RunRow[] }>
      })
      .then((body) => {
        if (!active || !body) {
          return
        }
        setRuns(body.runs ?? [])
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
  }, [isConnected, sessionVersion])

  const view: LoadState = isConnected ? state : 'unauthenticated'

  return (
    <section className="mt-8 rounded-card border border-frost/15 bg-void/70 p-6">
      <h2 className="font-display text-[26px] leading-none text-bone">Run history</h2>
      <p className="mt-3 text-[15px] leading-relaxed text-ash">
        Official submissions and their verification status.
      </p>

      <div className="mt-5">
        {view === 'loading' && (
          <p className="font-mono text-[12px] uppercase tracking-[-0.02em] text-ash">Loading runs</p>
        )}
        {view === 'unauthenticated' && (
          <p className="text-[15px] text-ash">Sign in above to see your runs.</p>
        )}
        {view === 'error' && (
          <p className="text-[15px] text-error">Run history could not be loaded.</p>
        )}
        {view === 'ready' && runs.length === 0 && (
          <p className="text-[15px] text-ash">No official runs yet.</p>
        )}
        {view === 'ready' && runs.length > 0 && (
          <ul className="divide-y divide-frost/10">
            {runs.map((run) => (
              <li
                key={run.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3 font-mono text-[12px] text-bone"
              >
                <span className="text-ash">{run.course_date}</span>
                <span className={run.status === 'rejected' ? 'text-error' : 'text-accent-teal'}>
                  {run.status}
                </span>
                <span>{run.verified_time_ms === null ? '-' : formatTime(run.verified_time_ms)}</span>
                <span className="text-ash">{run.onchain_tx_hash ? 'on-chain' : 'off-chain'}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
