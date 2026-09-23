'use client'

import { useState } from 'react'
import { AnimatePresence, motion, type PanInfo, type Variants } from 'motion/react'
import { CourseStack } from '@/components/landing/course-stack'
import { Reveal } from '@/components/landing/reveal'
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion'

const CARDS = [
  {
    title: 'The runner',
    body: "Kitsu is a short daily 3D runner built around fairness. Run, jump, slide, and switch lanes through a course that everyone shares, then submit your best attempt to the day's leaderboard.",
    image: 0,
  },
  {
    title: 'Same course',
    body: 'One seed per day builds one layout for everyone. Nobody gets an easier run.',
    image: 1,
  },
  {
    title: 'Verified runs',
    body: 'The server replays your input with the same engine. The result it produces is the one that counts.',
    image: 2,
  },
  {
    title: 'Funded rewards',
    body: 'Season rewards are paid from a sponsor-funded vault that never mints new tokens.',
    image: 3,
  },
]

const DRAG_THRESHOLD = 60

// Resolved through AnimatePresence `custom`, so a leaving card exits toward the latest direction.
const cardVariants: Variants = {
  enter: (dir: number) => ({ x: dir > 0 ? '12%' : '-12%', opacity: 0 }),
  center: { x: '0%', opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? '-12%' : '12%', opacity: 0 }),
}

export function About() {
  const reduce = usePrefersReducedMotion()
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const card = CARDS[index]

  function go(step: number) {
    setDirection(step >= 0 ? 1 : -1)
    setIndex((value) => (value + step + CARDS.length) % CARDS.length)
  }

  function handleDragEnd(_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (Math.abs(info.offset.x) < DRAG_THRESHOLD) {
      return
    }
    go(info.offset.x < 0 ? 1 : -1)
  }

  const arrowClass =
    'inline-flex h-11 w-11 items-center justify-center rounded-nav border border-frost text-bone transition-colors duration-200 hover:border-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary'

  return (
    <section id="about" data-section="about" className="scroll-mt-20 overflow-x-clip border-b border-frost/40">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <p className="font-mono text-[11px] uppercase tracking-[-0.02em] text-accent-teal">
          What Kitsu is
        </p>
        <h2 className="mt-4 max-w-2xl font-display text-[34px] leading-[1.05] text-bone max-lg:text-[28px]">
          A short daily 3D runner built around fairness.
        </h2>

        <div className="mt-10 grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <Reveal>
            <div className="mx-auto w-full max-w-[500px] sm:max-w-[540px] md:max-w-[560px] lg:max-w-none">
              <CourseStack activeIndex={card.image} interactive={false} />
            </div>
          </Reveal>

          <motion.div
            data-section="about-carousel"
            drag={reduce === true ? false : 'x'}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.12}
            onDragEnd={handleDragEnd}
            className="cursor-grab rounded-card border border-frost/40 bg-charcoal p-6 active:cursor-grabbing"
          >
            <div className="grid overflow-hidden">
              {/* Invisible copies of every card hold the box at the tallest card's height at any width, so the arrows below never shift. */}
              {CARDS.map((item) => (
                <div key={item.title} aria-hidden="true" className="invisible col-start-1 row-start-1">
                  <p className="font-display text-[22px] leading-tight">{item.title}</p>
                  <p className="mt-3 text-[14px] leading-relaxed">{item.body}</p>
                </div>
              ))}
              <AnimatePresence initial={false} custom={direction} mode="wait">
                <motion.div
                  key={card.title}
                  custom={direction}
                  variants={cardVariants}
                  initial={reduce === true ? false : 'enter'}
                  animate="center"
                  exit="exit"
                  transition={{ duration: reduce === true ? 0 : 0.2, ease: [0.16, 0.8, 0.3, 1] }}
                  className="col-start-1 row-start-1"
                >
                  <h3 className="font-display text-[22px] leading-tight text-bone">{card.title}</h3>
                  <p className="mt-3 text-[14px] leading-relaxed text-ash">{card.body}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-6 flex items-center justify-between gap-4">
              <button type="button" onClick={() => go(-1)} aria-label="Previous explanation" className={arrowClass}>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
                  <path
                    d="M15 6l-6 6 6 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <div role="tablist" aria-label="Explanation slides" className="flex items-center gap-1.5">
                <span className="sr-only" aria-live="polite">
                  Slide {index + 1} of {CARDS.length}
                </span>
                {CARDS.map((item, dotIndex) => (
                  <button
                    key={item.title}
                    type="button"
                    role="tab"
                    aria-selected={index === dotIndex}
                    aria-label={`Go to slide ${dotIndex + 1}: ${item.title}`}
                    onClick={() => {
                      setDirection(dotIndex >= index ? 1 : -1)
                      setIndex(dotIndex)
                    }}
                    className="group inline-flex h-8 items-center justify-center rounded-full px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
                  >
                    <span
                      className={`h-2 rounded-full transition-all duration-200 ${
                        index === dotIndex
                          ? 'w-5 bg-accent-teal'
                          : 'w-2 bg-frost/40 group-hover:bg-frost'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => go(1)} aria-label="Next explanation" className={arrowClass}>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
                  <path
                    d="M9 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
