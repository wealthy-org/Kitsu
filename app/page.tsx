import type { Metadata } from 'next'
import Link from 'next/link'
import { GridFloor } from '@/components/landing/grid-floor'
import { dailySeed } from '@/sim/prng'

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

export default function HomePage() {
  const todaySeed = dailySeed(new Date().toISOString())

  return (
    <main className="min-h-dvh bg-void text-bone">
      <header className="sticky top-0 z-40 flex h-15 items-center justify-between border-b border-frost/15 bg-void/70 px-6 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rotate-45 border border-bone" aria-hidden="true" />
          <span className="font-mono text-[13px] tracking-[-0.02em]">KITSU</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/profile"
            className="font-mono text-[11px] uppercase tracking-[-0.02em] text-frost underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-amber"
          >
            Profile
          </Link>
          <Link
            href="/play"
            className="inline-flex min-h-11 items-center rounded-nav border border-frost bg-charcoal px-5 font-mono text-[11px] uppercase tracking-[-0.02em] transition-colors duration-200 hover:bg-charcoal-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-amber"
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
            Course seed {todaySeed}
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
            className="mt-8 inline-flex min-h-11 items-center rounded-nav border border-frost bg-charcoal px-5 font-mono text-[12px] uppercase tracking-[-0.02em] transition-colors duration-200 hover:bg-charcoal-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-amber"
          >
            Enter today&apos;s course
          </Link>
        </div>
      </section>

      <section className="border-t border-frost/12 px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-[30px] leading-none text-bone">One course. No luck.</h2>
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
          <h2 className="font-display text-[30px] leading-none text-bone">Verified. Not trusted.</h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ash">
            A submitted run is re-simulated on the server with the exact same deterministic engine.
            The replayed result is what counts, never the score a client claims.
          </p>
        </div>
      </section>

      <section className="border-t border-frost/12 px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-[30px] leading-none text-bone">Season vault.</h2>
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
