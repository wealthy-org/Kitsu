import { HowStepper } from '@/components/landing/how-stepper'

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
        <HowStepper
          steps={STEPS}
          heading="How it works"
          intro="From the first jump to a seasonal reward, here is the full path of a run, step by step. Practice stays wallet-free; the wallet only comes in when you submit an official result."
        />
      </div>
    </section>
  )
}
