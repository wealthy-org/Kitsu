import type { Metadata } from 'next'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { Hero } from '@/components/landing/sections/hero'
import { About } from '@/components/landing/sections/about'
import { TodayRuns } from '@/components/landing/sections/today-runs'
import { HowItWorks } from '@/components/landing/sections/how-it-works'
import { Faq } from '@/components/landing/sections/faq'
import { Cta } from '@/components/landing/sections/cta'
import { listDailyLeaderboard } from '@/lib/repositories/leaderboard.repository'
import { getOrCreateCourse } from '@/lib/repositories/course.repository'
import { dailySeed } from '@/sim/prng'
import { todayIso, yesterdayIso } from '@/lib/util/date'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Kitsu - Same grid. Prove the run.',
  description:
    'A daily skill challenge runner. Every player gets the identical course, and every run is re-simulated before it counts.',
}

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
    <div className="min-h-dvh text-bone">
      <SiteHeader />
      <main>
        <Hero />
        <About />
        <TodayRuns
          date={today}
          obstacleCount={obstacleCount}
          finishDistance={finishDistance}
          previewReady={previewReady}
          topEntries={topEntries}
        />
        <HowItWorks />
        <Faq />
        <Cta />
      </main>
      <SiteFooter />
    </div>
  )
}
