import { BorderBeam } from '@/components/ui/border-beam'

const STEPS = [
  {
    title: 'One course, no luck',
    body: 'Each day is generated from a single date seed. Everyone runs the exact same layout, so the leaderboard measures skill, not a lucky roll.',
  },
  {
    title: 'Practice freely',
    body: 'Practice runs happen entirely in your browser and are never sent anywhere. Try as many times as you like without a wallet.',
  },
  {
    title: 'Play the course',
    body: 'Jump the high barriers, slide under the low ones, switch lanes around blocks, and clear every gap. One mistake ends the run; there are no lives or checkpoints.',
  },
  {
    title: 'Submit an official run',
    body: 'When you finish, connect a Phantom (EVM) wallet and sign a message to prove it is yours, then submit your run to the day\u2019s leaderboard.',
  },
  {
    title: 'Verified, not trusted',
    body: 'The server replays your recorded input with the same engine. Only the result it produces is accepted, so a claimed score is never taken on faith.',
  },
  {
    title: 'Proved on-chain',
    body: 'A scheduled relayer batches verified runs to Robinhood Chain, so results can be checked publicly and cannot be rewritten after the fact.',
  },
  {
    title: 'Season vault',
    body: 'Daily top ranks earn season points. At the end of a season, a sponsor-funded vault is shared in proportion to those points, paid from funds already held.',
  },
]

export function HowItWorks() {
  return (
    <section id="how" data-section="how" className="scroll-mt-20 border-b border-frost/40">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <h2 className="font-display text-[30px] leading-none text-bone">How it works</h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ash">
              From the first jump to a seasonal reward, here is the full path of a run. Practice
              stays wallet-free; the wallet only comes in when you submit an official result.
            </p>
          </div>
          <ol className="grid gap-4 sm:grid-cols-2">
            {STEPS.map((step, index) => (
              <li
                key={step.title}
                className="relative rounded-card border border-frost/50 bg-charcoal p-5 shadow-card transition-colors duration-200 hover:border-accent-primary/60 hover:bg-charcoal-hover"
              >
                <BorderBeam />
                <span className="font-mono text-[12px] uppercase tracking-[-0.02em] text-accent-soft">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-2 font-display text-[18px] leading-tight text-bone">
                  {step.title}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-ash">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
