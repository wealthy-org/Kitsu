const ITEMS = [
  {
    q: 'Is the course really the same for everyone?',
    a: 'Yes. Each day is generated from one date seed, so every player runs the identical layout. The seed is published on-chain, so the course cannot be changed after the fact.',
  },
  {
    q: 'Do I need a wallet to play?',
    a: 'No. Practice runs happen entirely in your browser and are never submitted anywhere. You only connect a wallet when you want to submit an official run.',
  },
  {
    q: 'How do you stop fake scores?',
    a: 'You send your recorded input, not a score. The server replays that input with the same deterministic engine and only accepts the result it produces; verified runs are then relayed on-chain.',
  },
  {
    q: 'What decides my rank?',
    a: 'Finish time. The leaderboard is sorted by the fastest verified time for the day. Coins add a secondary score and never change the ranking order.',
  },
  {
    q: 'Can I try more than once?',
    a: 'Yes. Official submissions are limited per wallet per day to prevent spam, and only your fastest time that day is kept on the leaderboard.',
  },
  {
    q: 'How are season rewards paid?',
    a: 'Daily top ranks earn season points. At the end of a season, a sponsor-funded vault shares rewards in proportion to those points, using only relayed runs. The vault never mints new tokens.',
  },
  {
    q: 'What happens when I hit an obstacle?',
    a: 'The run ends immediately. There are no lives or checkpoints, so a clean run has to be precise from start to finish.',
  },
]

export function Faq() {
  return (
    <section id="faq" data-section="faq" className="scroll-mt-20 border-b border-frost/40">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <h2 className="font-display text-[30px] leading-none text-bone">FAQ</h2>
        <p className="mt-4 text-[15px] leading-relaxed text-ash">
          Short answers about how runs, verification, and rewards work.
        </p>
        <div className="mt-8 divide-y divide-frost/40 border-y border-frost/40">
          {ITEMS.map((item) => (
            <details key={item.q} className="group">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-5 font-display text-[17px] leading-tight text-bone transition-colors duration-150 hover:text-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary [&::-webkit-details-marker]:hidden">
                {item.q}
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                  className="h-5 w-5 shrink-0 text-ash transition-transform duration-200 group-open:rotate-180"
                >
                  <path
                    d="m6 9 6 6 6-6"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </summary>
              <p className="pb-5 text-[14px] leading-relaxed text-ash">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
