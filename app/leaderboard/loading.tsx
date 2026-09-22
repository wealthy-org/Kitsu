import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'

export default function LeaderboardLoading() {
  return (
    <div className="min-h-dvh text-bone">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-6 py-16" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading the leaderboard</span>
        <div className="h-10 w-56 rounded-nav bg-charcoal motion-safe:animate-pulse" />
        <div className="mt-4 h-5 w-80 max-w-full rounded-nav bg-charcoal/70 motion-safe:animate-pulse" />

        <div className="mt-10 h-6 w-24 rounded-nav bg-charcoal motion-safe:animate-pulse" />
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          {[0, 1].map((card) => (
            <div
              key={card}
              className="rounded-card border border-frost/50 bg-charcoal p-6 shadow-card"
            >
              <div className="h-4 w-20 rounded-nav bg-frost/40 motion-safe:animate-pulse" />
              <div className="mt-5 grid gap-3">
                {[0, 1, 2].map((row) => (
                  <div
                    key={row}
                    className="h-4 w-full rounded-nav bg-frost/25 motion-safe:animate-pulse"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14 h-6 w-28 rounded-nav bg-charcoal motion-safe:animate-pulse" />
        <div className="mt-5 rounded-card border border-frost/50 bg-charcoal p-6 shadow-card">
          <div className="h-4 w-24 rounded-nav bg-frost/40 motion-safe:animate-pulse" />
          <div className="mt-5 grid gap-3">
            {[0, 1, 2, 3, 4].map((row) => (
              <div
                key={row}
                className="h-4 w-full rounded-nav bg-frost/25 motion-safe:animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
