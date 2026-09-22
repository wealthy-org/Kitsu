'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, useMotionValue, useReducedMotion, useTransform, type PanInfo } from 'motion/react'

const SLIDES = [
  { src: '/course-preview/start.webp', label: 'Start line' },
  { src: '/course-preview/mid.webp', label: 'Mid-city' },
  { src: '/course-preview/run.webp', label: 'Obstacles ahead' },
  { src: '/course-preview/shiba.webp', label: 'Kitsu at the ready' },
]

const SENSITIVITY = 180
const SPRING = { type: 'spring' as const, stiffness: 260, damping: 20 }

interface CardProps {
  onSendToBack: () => void
  sensitivity: number
  disableDrag: boolean
  children: React.ReactNode
}

function DraggableCard({ onSendToBack, sensitivity, disableDrag, children }: CardProps) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateX = useTransform(y, [-100, 100], [60, -60])
  const rotateY = useTransform(x, [-100, 100], [-60, 60])

  function handleDragEnd(_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (Math.abs(info.offset.x) > sensitivity || Math.abs(info.offset.y) > sensitivity) {
      onSendToBack()
      return
    }
    x.set(0)
    y.set(0)
  }

  if (disableDrag) {
    return <motion.div className="absolute inset-0">{children}</motion.div>
  }

  return (
    <motion.div
      className="absolute inset-0 cursor-grab"
      style={{ x, y, rotateX, rotateY }}
      drag
      dragConstraints={{ top: 0, right: 0, bottom: 0, left: 0 }}
      dragElastic={0.6}
      whileTap={{ cursor: 'grabbing' }}
      onDragEnd={handleDragEnd}
    >
      {children}
    </motion.div>
  )
}

export function CourseStack() {
  const reduce = useReducedMotion()
  const [order, setOrder] = useState(() =>
    // Rotation puts the last entry in front, so offset the start list to open on the first slide.
    SLIDES.map((_, index) => (index + 1) % SLIDES.length),
  )

  // The last entry is the front card, matching the stack's rotation and scale order.
  const active = order[order.length - 1]

  function sendToBack(slideIndex: number) {
    setOrder((previous) => [slideIndex, ...previous.filter((index) => index !== slideIndex)])
  }

  return (
    <div
      data-section="course-stack"
      className="relative w-full [perspective:600px]"
      style={{ aspectRatio: '1864 / 988' }}
    >
      {order.map((slideIndex, stackIndex) => (
        <DraggableCard
          key={slideIndex}
          sensitivity={SENSITIVITY}
          disableDrag={reduce === true}
          onSendToBack={() => sendToBack(slideIndex)}
        >
          <motion.div
            role="button"
            tabIndex={slideIndex === active ? 0 : -1}
            aria-hidden={slideIndex === active ? undefined : true}
            aria-label={`Show ${SLIDES[slideIndex].label}`}
            onClick={() => sendToBack(slideIndex)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                sendToBack(slideIndex)
              }
            }}
            initial={false}
            animate={{
              rotateZ: (order.length - stackIndex - 1) * 4,
              scale: 1 + stackIndex * 0.06 - order.length * 0.06,
              transformOrigin: '90% 90%',
            }}
            transition={reduce ? { duration: 0 } : SPRING}
            className="h-full w-full rounded-card border border-frost/40 bg-charcoal p-3 shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
          >
            <span className="block h-full w-full overflow-hidden rounded-nav border border-frost/30 bg-void">
              <Image
                src={SLIDES[slideIndex].src}
                alt={slideIndex === active ? SLIDES[slideIndex].label : ''}
                width={1864}
                height={988}
                preload={slideIndex === active}
                sizes="(min-width: 1024px) 560px, 100vw"
                className="pointer-events-none h-full w-full object-cover"
              />
            </span>
          </motion.div>
        </DraggableCard>
      ))}
    </div>
  )
}
