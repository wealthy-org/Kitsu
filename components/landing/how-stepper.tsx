'use client'

import { useState } from 'react'
import { motion, type Variants } from 'motion/react'
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion'

export interface StepperStep {
  title: string
  body: string
}

const slideVariants: Variants = {
  enter: (direction: number) => ({ x: direction >= 0 ? '12%' : '-12%', opacity: 0 }),
  center: { x: '0%', opacity: 1 },
}

export function HowStepper({
  steps,
  heading,
  intro,
}: {
  steps: StepperStep[]
  heading: string
  intro: string
}) {
  const [current, setCurrent] = useState(1)
  const [direction, setDirection] = useState(1)
  const reduce = usePrefersReducedMotion()
  const total = steps.length
  const step = steps[current - 1]
  const duration = reduce ? 0 : 0.32

  function goTo(next: number) {
    setDirection(next > current ? 1 : -1)
    setCurrent(next)
  }

  return (
    <div data-section="how-stepper" className="mx-auto w-full max-w-2xl">
      <div>
        <h2 className="font-display text-[30px] leading-none text-bone">{heading}</h2>
        <p className="mt-4 text-[15px] leading-relaxed text-ash">{intro}</p>
        <ol className="mt-10 flex items-center overflow-x-auto pb-1 [scrollbar-color:var(--color-frost)_transparent] [scrollbar-width:thin]">
          {steps.map((item, index) => {
            const stepNumber = index + 1
            const status =
              current === stepNumber ? 'active' : current < stepNumber ? 'inactive' : 'complete'
            return (
              <li key={item.title} className="flex flex-1 items-center last:flex-none">
                <button
                  type="button"
                  onClick={() => goTo(stepNumber)}
                  aria-label={`Step ${stepNumber}: ${item.title}`}
                  aria-current={status === 'active' ? 'step' : undefined}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-nav focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
                >
                  <motion.span
                    initial={false}
                    animate={{
                      backgroundColor:
                        status === 'inactive' ? 'rgba(51,65,85,0.7)' : 'rgb(99,102,241)',
                    }}
                    transition={{ duration: reduce ? 0 : 0.3 }}
                    className="flex h-9 w-9 items-center justify-center rounded-full font-mono text-[12px] text-white"
                  >
                    {status === 'complete' ? (
                      <motion.svg
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                        className="h-4 w-4"
                      >
                        <motion.path
                          d="M5 13l4 4L19 7"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={{ pathLength: reduce ? 1 : 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: reduce ? 0 : 0.3, ease: 'easeOut' }}
                        />
                      </motion.svg>
                    ) : status === 'active' ? (
                      <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-void" />
                    ) : (
                      stepNumber
                    )}
                  </motion.span>
                </button>

                {index < total - 1 && (
                  <span className="relative mx-2 h-0.5 flex-1 overflow-hidden rounded bg-frost/40">
                    <motion.span
                      className="absolute left-0 top-0 h-full bg-accent-primary"
                      initial={false}
                      animate={{ width: current > stepNumber ? '100%' : '0%' }}
                      transition={{ duration: reduce ? 0 : 0.4 }}
                    />
                  </span>
                )}
              </li>
            )
          })}
        </ol>

        <div className="relative mt-8 overflow-hidden">
          <motion.div
            key={current}
            custom={direction}
            variants={slideVariants}
            initial={reduce ? false : 'enter'}
            animate="center"
            transition={{ duration }}
          >
            <p className="font-mono text-[11px] uppercase tracking-[-0.02em] text-accent-soft">
              Step {String(current).padStart(2, '0')}
            </p>
            <h3 className="mt-3 font-display text-[22px] leading-tight text-bone">{step.title}</h3>
            <p className="mt-3 text-[14px] leading-relaxed text-ash">{step.body}</p>
          </motion.div>
        </div>

        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => goTo(current - 1)}
            disabled={current === 1}
            className="inline-flex min-h-11 items-center rounded-nav border border-frost px-4 font-mono text-[11px] uppercase tracking-[-0.02em] text-bone transition-colors duration-200 hover:border-bone disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => goTo(current === total ? 1 : current + 1)}
            className="inline-flex min-h-11 items-center rounded-nav bg-accent-primary px-5 font-mono text-[11px] uppercase tracking-[-0.02em] text-white transition-colors duration-200 hover:bg-accent-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
          >
            {current === total ? 'Back to start' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}
