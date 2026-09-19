import Link from 'next/link'
import { formatTime, shortenAddress } from '@/lib/util/format'

interface TopEntry {
  wallet_address: string
  best_time_ms: number
  best_score: number
}

export function TodayRuns({
  date,
  obstacleCount,
  finishDistance,
  previewReady,
  topEntries,
}: {
  date: string
  obstacleCount: number
  finishDistance: number
  previewReady: boolean
  topEntries: TopEntry[]
}) {
  return (
    <section id="today" data-section="today" className="scroll-mt-20 border-b border-frost/40">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="font-display text-[30px] leading-none text-bone">
              Today&apos;s course
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ash">
              {previewReady
                ? `${date}: ${obstacleCount} obstacles, finish at ${finishDistance} m. The same layout for every player today.`
                : 'Course preview is unavailable right now.'}
            </p>
            <Link
              href="/play"
              className="mt-6 inline-flex min-h-11 items-center rounded-nav bg-accent-primary px-5 font-mono text-[12px] uppercase tracking-[-0.02em] text-white transition-colors duration-200 hover:bg-accent-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-void"
            >
              Play today&apos;s course
            </Link>
          </div>

          <div className="[perspective:1100px]">
            <article className="rounded-card border border-frost/50 bg-charcoal p-6 shadow-card lg:[transform:rotateY(-11deg)_rotateX(2deg)_rotate(2deg)]">
              <p className="font-mono text-[11px] uppercase tracking-[-0.02em] text-accent-teal">
                Yesterday&apos;s top runs
              </p>
              {topEntries.length === 0 ? (
                <p className="mt-4 text-[15px] text-ash">No verified runs yesterday.</p>
              ) : (
                <ol className="mt-4 divide-y divide-frost/40">
                  {topEntries.map((entry, index) => (
                    <li
                      key={entry.wallet_address}
                      className="flex items-center justify-between py-3 font-mono text-[12px] text-bone"
                    >
                      <span className="text-accent-amber">{String(index + 1).padStart(2, '0')}</span>
                      <span className="text-ash">{shortenAddress(entry.wallet_address)}</span>
                      <span className="text-accent-teal">{formatTime(entry.best_time_ms)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </article>
          </div>
        </div>
      </div>
    </section>
  )
}
