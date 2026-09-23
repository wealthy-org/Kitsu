'use client'

import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react'
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion'

export interface WheelItem {
  label: string
  title: string
  body: string
}

// Adapted from React Bits "Option Wheel" (MIT + Commons Clause, David Haz), without the blur.
const SPACING = 1.4
const TILT = (6 * Math.PI) / 180
// Neighbours sit one row apart along the arc, so the tilt sets how tightly the list curls.
const RADIUS = SPACING / TILT
const FADE = 0.2
// 0.6 keeps an ash label on charcoal at 3.2:1, the large-text floor for every visible row.
const MIN_OPACITY = 0.6
const SMOOTHING_MS = 200
const DRAG_START_PX = 4
const WHEEL_SNAP_MS = 140

type ItemStyle = CSSProperties & { '--ow-mix': string }

function modulo(value: number, length: number): number {
  return ((value % length) + length) % length
}

// The list loops, so each label sits at its shortest distance around the wheel.
function loopDistance(index: number, position: number, count: number): number {
  const distance = modulo(index - position, count)
  return distance > count / 2 ? distance - count : distance
}

function styleFor(distance: number): ItemStyle {
  const angle = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, distance * TILT))
  const x = -RADIUS * (1 - Math.cos(angle))
  const y = RADIUS * Math.sin(angle)
  const far = Math.abs(distance)
  return {
    transform: `translate(${x.toFixed(3)}em, calc(${y.toFixed(3)}em - 50%)) rotate(${((angle * 180) / Math.PI).toFixed(3)}deg)`,
    opacity: Math.max(MIN_OPACITY, 1 - far * FADE).toFixed(3),
    '--ow-mix': Math.max(0, 1 - Math.min(far, 1)).toFixed(3),
  }
}

function paintItems(elements: (HTMLDivElement | null)[], position: number) {
  elements.forEach((element, index) => {
    if (!element) {
      return
    }
    const style = styleFor(loopDistance(index, position, elements.length))
    element.style.transform = String(style.transform)
    element.style.opacity = String(style.opacity)
    element.style.setProperty('--ow-mix', style['--ow-mix'])
  })
}

export function OptionWheel({ items }: { items: WheelItem[] }) {
  const reduce = usePrefersReducedMotion()
  const baseId = useId()
  const count = items.length
  const [selected, setSelected] = useState(0)
  const [dragging, setDragging] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const positionRef = useRef(0)
  const targetRef = useRef(0)
  const reduceRef = useRef(false)
  const startRef = useRef<(() => void) | null>(null)
  const dragRef = useRef<{ y: number; start: number; id: number; row: number } | null>(null)
  const dragMovedRef = useRef(false)

  // Same numbers the animation loop writes, so the server markup already shows the wheel at rest.
  const restingStyles = useMemo(
    () => items.map((_, index) => styleFor(loopDistance(index, 0, items.length))),
    [items],
  )

  useEffect(() => {
    reduceRef.current = reduce
  }, [reduce])

  useEffect(() => {
    let frame: number | null = null
    let last = 0
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const eased = 1 - Math.exp(-dt / (SMOOTHING_MS / 1000))
      const target = targetRef.current
      let next = positionRef.current + (target - positionRef.current) * eased
      const settled = Math.abs(target - next) < 0.001
      if (settled) {
        next = target
      }
      positionRef.current = next
      paintItems(itemRefs.current, next)
      frame = settled ? null : requestAnimationFrame(tick)
    }
    startRef.current = () => {
      if (frame !== null) {
        cancelAnimationFrame(frame)
      }
      last = performance.now()
      frame = requestAnimationFrame(tick)
    }
    return () => {
      if (frame !== null) {
        cancelAnimationFrame(frame)
      }
      startRef.current = null
    }
  }, [])

  const move = useCallback(
    (value: number, snap: boolean) => {
      const next = snap ? Math.round(value) : value
      targetRef.current = next
      setSelected(modulo(Math.round(next), count))
      if (reduceRef.current) {
        positionRef.current = next
        paintItems(itemRefs.current, next)
        return
      }
      startRef.current?.()
    },
    [count],
  )

  // Shortest way around the wheel from the current target to a label.
  const nearest = useCallback(
    (index: number) => {
      const current = Math.round(targetRef.current)
      return current + loopDistance(index, current, count)
    },
    [count],
  )

  const rowPx = useCallback(() => {
    const root = rootRef.current
    return root ? parseFloat(getComputedStyle(root).fontSize) * SPACING : 48 * SPACING
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root) {
      return undefined
    }
    let snapTimer: number | null = null
    const onWheel = (event: WheelEvent) => {
      const delta = event.deltaMode === 1 ? event.deltaY * 24 : event.deltaY
      const target = targetRef.current
      const index = modulo(Math.round(target), count)
      // The wheel only spins between the first and last question, then hands scrolling back to the page.
      if ((delta < 0 && index === 0) || (delta > 0 && index === count - 1)) {
        return
      }
      event.preventDefault()
      move(target + Math.max(-1, Math.min(1, delta / rowPx())), false)
      if (snapTimer !== null) {
        window.clearTimeout(snapTimer)
      }
      snapTimer = window.setTimeout(() => move(targetRef.current, true), WHEEL_SNAP_MS)
    }
    root.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      root.removeEventListener('wheel', onWheel)
      if (snapTimer !== null) {
        window.clearTimeout(snapTimer)
      }
    }
  }, [count, move, rowPx])

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    dragMovedRef.current = false
    // Touch keeps native page scrolling; a tap on a label still selects it.
    if (event.pointerType === 'touch' || event.button !== 0) {
      return
    }
    dragRef.current = { y: event.clientY, start: targetRef.current, id: event.pointerId, row: rowPx() }
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag) {
      return
    }
    const dy = event.clientY - drag.y
    if (!dragMovedRef.current && Math.abs(dy) > DRAG_START_PX) {
      dragMovedRef.current = true
      rootRef.current?.setPointerCapture(drag.id)
      setDragging(true)
    }
    if (dragMovedRef.current) {
      move(drag.start - dy / drag.row, false)
    }
  }

  function onPointerEnd() {
    if (!dragRef.current) {
      return
    }
    dragRef.current = null
    if (dragMovedRef.current) {
      setDragging(false)
      move(targetRef.current, true)
    }
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const current = Math.round(targetRef.current)
    const next =
      event.key === 'ArrowUp' || event.key === 'ArrowLeft'
        ? current - 1
        : event.key === 'ArrowDown' || event.key === 'ArrowRight'
          ? current + 1
          : event.key === 'Home'
            ? nearest(0)
            : event.key === 'End'
              ? nearest(count - 1)
              : null
    if (next === null) {
      return
    }
    event.preventDefault()
    move(next, true)
  }

  return (
    <div
      data-section="faq-wheel"
      className="mx-auto grid max-w-4xl items-center gap-6 lg:grid-cols-[minmax(0,300px)_1fr] lg:gap-6"
    >
      <div
        ref={rootRef}
        role="listbox"
        tabIndex={0}
        aria-label="FAQ questions"
        aria-activedescendant={`${baseId}-${selected}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onKeyDown={onKeyDown}
        className={`relative h-[7.5em] w-full select-none overflow-hidden rounded-xl text-[26px] md:text-[32px] [--ow-inset:0.75em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary ${
          dragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {items.map((item, index) => (
          <div
            key={item.label}
            id={`${baseId}-${index}`}
            ref={(element) => {
              itemRefs.current[index] = element
            }}
            role="option"
            aria-selected={selected === index}
            onClick={() => {
              if (!dragMovedRef.current) {
                move(nearest(index), true)
              }
            }}
            style={restingStyles[index]}
            className={`absolute left-[var(--ow-inset)] top-1/2 origin-left cursor-pointer whitespace-nowrap py-[0.35em] font-display leading-none will-change-[transform,opacity] [color:color-mix(in_srgb,var(--color-bone)_calc(var(--ow-mix,0)*100%),var(--color-ash))] ${
              selected === index ? 'font-medium' : 'font-extralight'
            }`}
          >
            {item.label}
          </div>
        ))}
      </div>

      <div aria-live="polite" className="w-full rounded-card border border-frost/50 bg-charcoal p-6 md:p-8">
        <h3 className="font-display text-[19px] leading-tight text-bone">{items[selected].title}</h3>
        <p className="mt-3 text-[14px] leading-relaxed text-ash">{items[selected].body}</p>
      </div>
    </div>
  )
}
