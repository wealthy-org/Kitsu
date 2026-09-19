'use client'

import { useQuery } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { formatTime } from '@/lib/util/format'

interface RunRow {
  id: string
  course_date: string
  status: string
  verified_time_ms: number | null
  verified_score: number | null
  onchain_tx_hash: string | null
}

interface RunsResponse {
  runs: RunRow[]
  unauthenticated: boolean
}

async function fetchRuns(): Promise<RunsResponse> {
  const sessionResponse = await fetch('/api/wallet/session')
  const session = sessionResponse.ok
    ? ((await sessionResponse.json()) as { wallet: string | null })
    : { wallet: null }
  if (!session.wallet) {
    return { runs: [], unauthenticated: true }
  }

  const response = await fetch('/api/run/history')
  if (response.status === 401) {
    return { runs: [], unauthenticated: true }
  }
  if (!response.ok) {
    throw new Error('failed')
  }
  const body = (await response.json()) as { runs?: RunRow[] }
  return { runs: body.runs ?? [], unauthenticated: false }
}

type LoadState = 'loading' | 'ready' | 'unauthenticated' | 'error'

export function RunHistory({ sessionVersion }: { sessionVersion: number }) {
  const { isConnected } = useAccount()
  const online = useOnlineStatus()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['runs', sessionVersion],
    queryFn: fetchRuns,
    enabled: isConnected,
    refetchInterval: 5000,
    retry: false,
  })

  const view: LoadState = !isConnected
    ? 'unauthenticated'
    : isLoading
      ? 'loading'
      : isError
        ? 'error'
        : data?.unauthenticated
          ? 'unauthenticated'
          : 'ready'
  const runs = data?.runs ?? []

  return (
    <section className="mt-8 rounded-card border border-frost/15 bg-void/70 p-6">
      <h2 className="font-display text-[26px] leading-none text-bone">Your Run History</h2>
      <p className="mt-3 text-[15px] leading-relaxed text-ash">
        Official submissions and their verification status.
      </p>

      {!online && (
        <p className="mt-4 rounded-nav border border-frost/25 px-4 py-2 font-mono text-[11px] uppercase tracking-[-0.02em] text-error">
          Connection lost
        </p>
      )}

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
                className="flex flex-wrap items-center justify-between gap-3 py-3 font-mono text-[12px] text-bone"
              >
                <span className="text-ash">{run.course_date}</span>
                <span className={run.status === 'rejected' ? 'text-error' : 'text-accent-teal'}>
                  {run.status}
                </span>
                <span>{run.verified_time_ms === null ? '-' : formatTime(run.verified_time_ms)}</span>
                <a
                  href={`/api/share/${run.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent-soft underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
                >
                  Share card
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
