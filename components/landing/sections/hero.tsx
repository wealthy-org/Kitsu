import Link from 'next/link'
import { HeroGrid } from '@/components/landing/hero-grid'

export function Hero() {
  return (
    <section
      id="hero"
      data-section="hero"
      className="relative overflow-hidden border-b border-frost/40"
    >
      <HeroGrid />
      <div className="relative mx-auto max-w-6xl px-6 py-24 md:py-32">
        <p className="font-mono text-[11px] uppercase tracking-[-0.02em] text-accent-teal">
          Daily skill challenge runner
        </p>
        <h1 className="mt-5 font-display text-[52px] leading-[0.86] text-bone md:text-[72px]">
          SAME GRID.
          <br />
          PROVE THE RUN.
        </h1>
        <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-ash">
          Every player gets the exact same course each day. No random layouts and no lucky rolls, so
          the leaderboard reflects skill alone. Practice is free and needs no wallet.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/play"
            className="inline-flex min-h-11 items-center rounded-nav bg-accent-primary px-5 font-mono text-[12px] uppercase tracking-[-0.02em] text-white transition-colors duration-200 hover:bg-accent-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-void"
          >
            Play today&apos;s course
          </Link>
          <Link
            href="/connect/wallet"
            className="inline-flex min-h-11 items-center rounded-nav border border-frost px-5 font-mono text-[12px] uppercase tracking-[-0.02em] text-bone transition-colors duration-200 hover:border-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
          >
            Connect wallet
          </Link>
        </div>
      </div>
    </section>
  )
}
