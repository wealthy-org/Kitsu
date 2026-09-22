import type { Metadata } from 'next'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { Hero } from '@/components/landing/sections/hero'
import { About } from '@/components/landing/sections/about'
import { TodayRuns } from '@/components/landing/sections/today-runs'
import { HowItWorks } from '@/components/landing/sections/how-it-works'
import { Faq } from '@/components/landing/sections/faq'
import { Cta } from '@/components/landing/sections/cta'
import { listSeasonDailyBests } from '@/lib/repositories/season.repository'
import { computeSeasonBoard } from '@/lib/services/season-reward.service'
import { ensureActiveSeason } from '@/lib/services/season.service'
import { getOrCreateCourse } from '@/lib/repositories/course.repository'
import { dailySeed } from '@/sim/prng'
import { todayIso } from '@/lib/util/date'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Kitsu - Same grid. Prove the run.',
  description:
    'A daily skill challenge runner. Every player gets the identical course, and every run is re-simulated before it counts.',
}

export default async function HomePage() {
  const today = todayIso()

  let obstacleCount = 0
  let finishDistance = 0
  let previewReady = false
  let seasonLabel = ''
  let seasonTop: Array<{ wallet_address: string; points: number }> = []

  try {
    const course = await getOrCreateCourse(today, dailySeed(today))
    obstacleCount = course.segments.filter((segment) => segment.type !== 'coin_row').length
    finishDistance = Math.round(course.finish_distance)
    previewReady = true

    const season = await ensureActiveSeason(today)
    const [provisional, confirmed] = await Promise.all([
      listSeasonDailyBests(season.startDate, season.endDate, ['verified', 'relayed']),
      listSeasonDailyBests(season.startDate, season.endDate, ['relayed']),
    ])
    const { entries } = computeSeasonBoard({
      provisional,
      confirmed,
      pool: Number(season.pool),
    })
    seasonLabel = season.label
    seasonTop = entries.slice(0, 3).map((entry) => ({
      wallet_address: entry.walletAddress,
      points: entry.points,
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
          seasonLabel={seasonLabel}
          seasonTop={seasonTop}
        />
        <HowItWorks />
        <Faq />
        <Cta />
      </main>
      <SiteFooter />
    </div>
  )
}
