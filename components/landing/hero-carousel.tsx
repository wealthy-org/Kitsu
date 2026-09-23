'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion, type PanInfo, type Variants } from 'motion/react'
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion'

const SLIDES = [
  { src: '/course-preview/start-line.webp', label: 'Start line' },
  { src: '/course-preview/mid-city.webp', label: 'Mid-city' },
  { src: '/course-preview/obstacles-ahead.webp', label: 'Obstacles ahead' },
  { src: '/course-preview/kitsu-ready.webp', label: 'Kitsu at the ready' },
]

const AUTO_DELAY_MS = 5000
const DRAG_THRESHOLD = 70

// Resolved through AnimatePresence `custom`, so a leaving slide exits toward the latest direction.
const slideVariants: Variants = {
  enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%' }),
  center: { x: '0%' },
  exit: (dir: number) => ({ x: dir > 0 ? '-100%' : '100%' }),
}

export function HeroCarousel() {
  const reduce = usePrefersReducedMotion()
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [paused, setPaused] = useState(false)

  const go = useCallback((step: number) => {
    setDirection(step >= 0 ? 1 : -1)
    setIndex((value) => (value + step + SLIDES.length) % SLIDES.length)
  }, [])

  useEffect(() => {
    if (reduce || paused) {
      return undefined
    }
    const id = window.setInterval(() => go(1), AUTO_DELAY_MS)
    return () => window.clearInterval(id)
  }, [go, paused, reduce])

  function handleDragEnd(_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (Math.abs(info.offset.x) < DRAG_THRESHOLD) {
      return
    }
    go(info.offset.x < 0 ? 1 : -1)
  }

  return (
    <div
      data-section="hero-carousel"
      aria-roledescription="carousel"
      aria-label="Course previews"
      className="absolute inset-0 overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <motion.div
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        drag={reduce ? false : 'x'}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.12}
        onDragEnd={handleDragEnd}
      >
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={SLIDES[index].src}
            custom={direction}
            variants={slideVariants}
            initial={reduce ? false : 'enter'}
            animate="center"
            exit="exit"
            transition={{ duration: reduce ? 0 : 0.55, ease: [0.16, 0.8, 0.3, 1] }}
            className="absolute inset-0"
          >
            <Image
              src={SLIDES[index].src}
              alt={SLIDES[index].label}
              fill
              preload={index === 0}
              sizes="100vw"
              draggable={false}
              className="pointer-events-none object-cover"
            />
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
