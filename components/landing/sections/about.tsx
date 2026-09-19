import { BorderBeam } from '@/components/ui/border-beam'

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
    <section
      id="about"
      data-section="about"
      className="scroll-mt-20 border-b border-frost/40"
    >
      <div className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="font-display text-[30px] leading-none text-bone">What Kitsu is</h2>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ash">
          Kitsu is a short daily 3D runner built around fairness. Run, jump, slide, and switch lanes
          through a course that everyone shares, then submit your best attempt to the day&apos;s
          leaderboard.
        </p>
        <div className="relative mt-10 grid gap-px overflow-hidden rounded-card border border-frost/50 bg-frost/50 md:grid-cols-3">
          {POINTS.map((point, index) => (
            <article
              key={point.label}
              className="relative bg-charcoal p-6 transition-colors duration-200 hover:bg-charcoal-hover"
            >
              <BorderBeam />
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 select-none font-mono text-sm leading-none text-frost"
                >
                  +
                </span>
              )}
              <h3 className="font-display text-[20px] leading-tight text-bone">{point.label}</h3>
              <p className="mt-3 text-[14px] leading-relaxed text-ash">{point.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
