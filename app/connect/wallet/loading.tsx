import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'

export default function ConnectWalletLoading() {
  return (
    <div className="min-h-dvh text-bone">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-6 py-16" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading your wallet panel</span>
        <div className="h-10 w-64 rounded-nav bg-charcoal motion-safe:animate-pulse" />
        <div className="mt-4 h-5 w-full max-w-lg rounded-nav bg-charcoal/70 motion-safe:animate-pulse" />

        <div className="mt-10 rounded-card border border-frost/50 bg-charcoal p-6 shadow-card">
          <div className="h-4 w-28 rounded-nav bg-frost/40 motion-safe:animate-pulse" />
          <div className="mt-5 grid gap-3">
            {[0, 1, 2].map((row) => (
              <div
                key={row}
                className="h-4 w-full rounded-nav bg-frost/25 motion-safe:animate-pulse"
              />
            ))}
          </div>
          <div className="mt-6 h-11 w-44 rounded-nav bg-accent-primary/30 motion-safe:animate-pulse" />
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
