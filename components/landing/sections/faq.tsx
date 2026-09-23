'use client'

import { OptionWheel } from '@/components/landing/option-wheel'

const ITEMS = [
  {
    label: 'Same course',
    title: 'Is the course really the same for everyone?',
    body: 'Yes. Each day is generated from one date seed, so every player runs the identical layout. The seed is published on-chain, so the course cannot be changed after the fact.',
  },
  {
    label: 'No wallet',
    title: 'Do I need a wallet to play?',
    body: 'No. Practice runs happen entirely in your browser and are never submitted anywhere. You only connect a wallet when you want to submit an official run.',
  },
  {
    label: 'Fake scores',
    title: 'How do you stop fake scores?',
    body: 'You send your recorded input, not a score. The server replays that input with the same deterministic engine and only accepts the result it produces; verified runs are then relayed on-chain.',
  },
  {
    label: 'Ranking',
    title: 'What decides my rank?',
    body: 'Finish time. The leaderboard is sorted by the fastest verified time for the day. Coins add a secondary score and never change the ranking order.',
  },
  {
    label: 'Retries',
    title: 'Can I try more than once?',
    body: 'Yes. Official submissions are limited per wallet per day to prevent spam, and only your fastest time that day is kept on the leaderboard.',
  },
  {
    label: 'Rewards',
    title: 'How are season rewards paid?',
    body: 'Daily top ranks earn season points. At the end of a season, a sponsor-funded vault shares rewards in proportion to those points, using only relayed runs. The vault never mints new tokens.',
  },
  {
    label: 'Obstacles',
    title: 'What happens when I hit an obstacle?',
    body: 'The run ends immediately. There are no lives or checkpoints, so a clean run has to be precise from start to finish.',
  },
]

export function Faq() {
  return (
    <section id="faq" data-section="faq" className="scroll-mt-20 border-b border-frost/40">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="font-display text-[30px] leading-none text-bone">FAQ</h2>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ash">
          Short answers about how runs, verification, and rewards work.
        </p>
        <div className="mt-10">
          <OptionWheel items={ITEMS} />
        </div>
      </div>
    </section>
  )
}
