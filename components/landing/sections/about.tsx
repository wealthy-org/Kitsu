import Image from 'next/image'
import { Reveal } from '@/components/landing/reveal'

const POINTS = [
  {
    label: 'Same course',
    body: 'One seed per day builds one layout for everyone. Nobody gets an easier run.',
  },
  {
    label: 'Verified runs',
    body: 'The server replays your input with the same engine. The result it produces is the one that counts.',
  },
  {
    label: 'Funded rewards',
    body: 'Season rewards are paid from a sponsor-funded vault that never mints new tokens.',
  },
]

export function About() {
  return (
    <section id="about" data-section="about" className="scroll-mt-20 border-b border-frost/40">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <p className="font-mono text-[11px] uppercase tracking-[-0.02em] text-accent-teal">
          What Kitsu is
        </p>
        <h2 className="mt-4 max-w-2xl font-display text-[34px] leading-[1.05] text-bone max-lg:text-[28px]">
          A short daily 3D runner built around fairness.
        </h2>

        <Reveal className="mt-10">
          <article className="overflow-hidden rounded-card border border-frost/50 bg-charcoal shadow-card">
            <div className="grid items-center lg:grid-cols-[1.3fr_1fr]">
              <div className="relative aspect-[16/9] w-full bg-void">
                <Image
                  src="/course-preview/shiba.webp"
                  alt="Kitsu on the night course"
                  fill
                  sizes="(min-width: 1024px) 640px, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="p-8">
                <p className="font-mono text-[11px] uppercase tracking-[-0.02em] text-accent-soft">
                  The runner
                </p>
                <p className="mt-4 text-[15px] leading-relaxed text-ash">
                  Kitsu is a short daily 3D runner built around fairness. Run, jump, slide, and switch
                  lanes through a course that everyone shares, then submit your best attempt to the
                  day&apos;s leaderboard.
                </p>
              </div>
            </div>
          </article>
        </Reveal>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {POINTS.map((point, index) => (
            <Reveal key={point.label} delay={0.08 * index}>
              <article className="h-full rounded-card border border-frost/40 bg-charcoal p-6">
                <h3 className="font-display text-[19px] leading-tight text-bone">{point.label}</h3>
                <p className="mt-3 text-[14px] leading-relaxed text-ash">{point.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
