import Link from 'next/link'

export function Cta() {
  return (
    <section id="cta" data-section="cta" className="border-b border-frost/40">
      <div className="mx-auto max-w-6xl px-6 py-20 text-center">
        <h2 className="font-display text-[32px] leading-tight text-bone md:text-[40px]">
          Ready to post a real result?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-ash">
          Connect your wallet and sign in to submit official runs and appear on the leaderboard.
          Practice stays open to everyone without a wallet.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/connect/wallet"
            className="inline-flex min-h-11 items-center rounded-nav bg-accent-primary px-5 font-mono text-[12px] uppercase tracking-[-0.02em] text-white transition-colors duration-200 hover:bg-accent-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-void"
          >
            Connect wallet
          </Link>
          <Link
            href="/play"
            className="inline-flex min-h-11 items-center rounded-nav border border-frost px-5 font-mono text-[12px] uppercase tracking-[-0.02em] text-bone transition-colors duration-200 hover:border-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
          >
            Play Course
          </Link>
        </div>
      </div>
    </section>
  )
}
