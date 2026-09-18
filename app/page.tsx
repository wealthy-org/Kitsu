import type { Metadata } from 'next'
import Link from 'next/link'
import { GridFloor } from '@/components/landing/grid-floor'
import { listDailyLeaderboard } from '@/lib/repositories/leaderboard.repository'
import { getOrCreateCourse } from '@/lib/repositories/course.repository'
import { dailySeed } from '@/sim/prng'
import { todayIso, yesterdayIso } from '@/lib/util/date'
import { formatTime, shortenAddress } from '@/lib/util/format'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Kitsu - Same grid. Prove the run.',
  description:
    'A daily skill challenge runner. Every player gets the identical course, and every run is re-simulated before it counts.',
}

const OBSTACLES = [
  { label: 'Barrier high', action: 'Jump before the collision point' },
  { label: 'Barrier low', action: 'Slide under it' },
  { label: 'Lane block', action: 'Switch to an open lane' },
  { label: 'Gap', action: 'Jump across the full width' },
  { label: 'Moving obstacle', action: 'Time your action to its pattern' },
  { label: 'Coin row', action: 'Optional: collect for a secondary score' },
]

export default async function HomePage() {
  const today = todayIso()
  const yesterday = yesterdayIso()

  let obstacleCount = 0
  let finishDistance = 0
  let previewReady = false
  let topEntries: Array<{ wallet_address: string; best_time_ms: number; best_score: number }> = []

  try {
    const course = await getOrCreateCourse(today, dailySeed(today))
    obstacleCount = course.segments.filter((segment) => segment.type !== 'coin_row').length
    finishDistance = Math.round(course.finish_distance)
    previewReady = true
    topEntries = (await listDailyLeaderboard(yesterday, 3)).map((entry) => ({
      wallet_address: entry.wallet_address,
      best_time_ms: entry.best_time_ms,
      best_score: entry.best_score,
    }))
  } catch {
    previewReady = false
  }

  return (
    <main className="min-h-dvh bg-void text-bone">
      <header className="sticky top-0 z-40 flex h-15 items-center justify-between border-b border-frost/15 bg-void/70 px-6 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rotate-45 border border-accent-amber" aria-hidden="true" />
          <span className="font-mono text-[13px] tracking-[-0.02em]">KITSU</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/leaderboard"
            className="font-mono text-[11px] uppercase tracking-[-0.02em] text-frost underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-amber"
          >
            Leaderboard
          </Link>
          <Link
            href="/season"
            className="font-mono text-[11px] uppercase tracking-[-0.02em] text-frost underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-amber"
          >
            Season
          </Link>
          <Link
            href="/profile"
            className="font-mono text-[11px] uppercase tracking-[-0.02em] text-frost underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-amber"
          >
            Profile
          </Link>
          <Link
            href="/play"
            className="inline-flex min-h-11 items-center rounded-nav border border-accent-amber bg-charcoal px-5 font-mono text-[11px] uppercase tracking-[-0.02em] transition-colors duration-200 hover:bg-charcoal-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-amber"
          >
            Play
          </Link>
        </div>
      </header>

      <p className="border-b border-frost/12 px-6 py-3 font-mono text-[10px] uppercase tracking-[-0.02em] text-accent-amber lg:hidden">
        Optimized for desktop. Narrow windows may limit the experience.
      </p>

      <section className="relative overflow-hidden px-6 pt-24 pb-20">
        <GridFloor />
        <div className="relative mx-auto max-w-3xl">
          <p className="font-mono text-[10px] uppercase tracking-[-0.02em] text-accent-teal">
            Course seed {today}
          </p>
          <h1 className="mt-6 font-display text-[80px] leading-[0.78] text-bone max-lg:text-[52px]">
            SAME GRID.
            <br />
            PROVE THE RUN.
          </h1>
          <p className="mt-6 max-w-xl font-display text-[26px] leading-tight text-bone">
            Daily skill challenge runner
          </p>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ash">
            Every player gets the exact same course each day. No randomized layouts and no lucky
            rolls, so the leaderboard reflects skill alone. Practice is free and needs no wallet.
          </p>
          <Link
            href="/play"
            className="mt-8 inline-flex min-h-11 items-center rounded-nav border border-accent-amber bg-charcoal px-5 font-mono text-[12px] uppercase tracking-[-0.02em] transition-colors duration-200 hover:bg-charcoal-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-amber"
          >
            Enter today&apos;s course
          </Link>
        </div>
      </section>

      <section className="border-t border-frost/12 px-6 py-20">
        <div className="mx-auto grid max-w-3xl gap-12 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-[30px] leading-none text-bone">
              <span className="text-accent-amber">Today&apos;s</span> course
            </h2>
            {previewReady ? (
              <p className="mt-4 text-[15px] leading-relaxed text-ash">
                {obstacleCount} obstacles, finish at {finishDistance} m. The same layout for every
                player today.
              </p>
            ) : (
              <p className="mt-4 text-[15px] text-ash">Course preview is unavailable right now.</p>
            )}
            <Link
              href="/play"
              className="mt-6 inline-flex min-h-11 items-center rounded-nav border border-frost px-5 font-mono text-[12px] uppercase tracking-[-0.02em] transition-colors duration-200 hover:border-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-amber"
            >
              Play today&apos;s course
            </Link>
          </div>
          <div>
            <h2 className="font-display text-[30px] leading-none text-bone">
              <span className="text-accent-teal">Yesterday&apos;s</span> top runs
            </h2>
            {topEntries.length === 0 ? (
              <p className="mt-4 text-[15px] text-ash">No verified runs yesterday.</p>
            ) : (
              <ol className="mt-4 divide-y divide-frost/10">
                {topEntries.map((entry, index) => (
                  <li
                    key={entry.wallet_address}
                    className="flex items-center justify-between py-3 font-mono text-[12px] text-bone"
                  >
                    <span className="text-accent-amber">{String(index + 1).padStart(2, '0')}</span>
                    <span>{shortenAddress(entry.wallet_address)}</span>
                    <span className="text-accent-teal">{formatTime(entry.best_time_ms)}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </section>

      <section className="border-t border-frost/12 px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-[30px] leading-none text-bone">
            One course. <span className="text-accent-teal">No luck.</span>
          </h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ash">
            The course is generated from a single seed for the day. The run is finite: one mistake
            ends it, with no lives and no checkpoints.
          </p>
          <ul className="mt-8 divide-y divide-frost/12 border-y border-frost/12">
            {OBSTACLES.map((item) => (
              <li key={item.label} className="flex flex-wrap items-baseline gap-x-6 gap-y-1 py-4">
                <span className="w-44 font-mono text-[11px] uppercase tracking-[-0.02em] text-accent-amber">
                  {item.label}
                </span>
                <span className="text-[15px] text-bone">{item.action}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-frost/12 px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-[30px] leading-none text-bone">
            Verified. <span className="text-accent-amber">Not trusted.</span>
          </h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ash">
            A submitted run is re-simulated on the server with the exact same deterministic engine.
            The replayed result is what counts, never the score a client claims.
          </p>
        </div>
      </section>

      <section className="border-t border-frost/12 px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-[30px] leading-none text-bone">
            <span className="text-accent-amber">Season</span> vault.
          </h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ash">
            Daily ranks earn seasonal points, and a sponsor-funded vault is shared in proportion to
            those points. Rewards are paid from funds already held in the vault, never by minting.
          </p>
        </div>
      </section>

      <footer className="border-t border-frost/12 px-6 py-10">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4">
          <p className="font-mono text-[10px] uppercase tracking-[-0.02em] text-ash">
            Kitsu - Robinhood Chain testnet
          </p>
          <Link
            href="/play"
            className="font-mono text-[11px] uppercase tracking-[-0.02em] text-accent-teal underline-offset-4 hover:underline"
          >
            Start a practice run
          </Link>
        </div>
      </footer>
    </main>
  )
}
