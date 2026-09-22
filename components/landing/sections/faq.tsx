'use client'

import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

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
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const reduce = useReducedMotion()
  const panelTransition = { duration: reduce ? 0 : 0.28, ease: [0.16, 0.8, 0.3, 1] as const }

  return (
    <section id="faq" data-section="faq" className="scroll-mt-20 border-b border-frost/40">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <h2 className="font-display text-[30px] leading-none text-bone">FAQ</h2>
        <p className="mt-4 text-[15px] leading-relaxed text-ash">
          Short answers about how runs, verification, and rewards work.
        </p>
        <div className="mt-8 border-y border-frost/40">
          {ITEMS.map((item, index) => {
            const isOpen = openIndex === index
            const panelId = `faq-panel-${index}`
            const buttonId = `faq-button-${index}`
            return (
              <div key={item.q} className="border-b border-frost/40 last:border-b-0">
                <h3>
                  <button
                    type="button"
                    id={buttonId}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-4 py-5 text-left font-display text-[17px] leading-tight text-bone transition-colors duration-150 hover:text-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
                  >
                    {item.q}
                    <motion.svg
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={panelTransition}
                      className="h-5 w-5 shrink-0 text-ash"
                    >
                      <path
                        d="m6 9 6 6 6-6"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </motion.svg>
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="panel"
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      initial={reduce ? false : { height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={reduce ? undefined : { height: 0, opacity: 0 }}
                      transition={panelTransition}
                      className="overflow-hidden"
                    >
                      <p className="pb-5 text-[14px] leading-relaxed text-ash">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
