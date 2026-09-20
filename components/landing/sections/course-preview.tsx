'use client'

import { useState } from 'react'
import Image from 'next/image'

const SLIDES = [
  { src: '/course-preview/start.webp', label: 'Start line' },
  { src: '/course-preview/mid.webp', label: 'Mid-city' },
  { src: '/course-preview/run.webp', label: 'Obstacles ahead' },
  { src: '/course-preview/shiba.webp', label: 'Kitsu at the ready' },
]

export function CoursePreview() {
  const [index, setIndex] = useState(0)
  const slide = SLIDES[index]

  return (
    <div data-section="course-preview" className="rounded-card border border-frost/50 bg-charcoal p-4 shadow-card">
      <div className="relative aspect-[16/9] overflow-hidden rounded-nav bg-void">
        <Image
          src={slide.src}
          alt={slide.label}
          fill
          sizes="(min-width: 1024px) 520px, 100vw"
          className="object-cover"
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setIndex((value) => (value - 1 + SLIDES.length) % SLIDES.length)}
          className="inline-flex min-h-9 items-center rounded-nav border border-frost px-3 font-mono text-[11px] uppercase tracking-[-0.02em] text-bone transition-colors duration-200 hover:border-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
        >
          Prev
        </button>
        <p aria-live="polite" className="font-mono text-[11px] uppercase tracking-[-0.02em] text-ash">
          {slide.label} ({index + 1}/{SLIDES.length})
        </p>
        <button
          type="button"
          onClick={() => setIndex((value) => (value + 1) % SLIDES.length)}
          className="inline-flex min-h-9 items-center rounded-nav border border-frost px-3 font-mono text-[11px] uppercase tracking-[-0.02em] text-bone transition-colors duration-200 hover:border-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
        >
          Next
        </button>
      </div>

      <div className="mt-3 flex justify-center gap-2">
        {SLIDES.map((item, dotIndex) => (
          <button
            key={item.src}
            type="button"
            aria-label={`Show ${item.label}`}
            onClick={() => setIndex(dotIndex)}
            className={`h-2 w-2 rounded-full transition-colors duration-200 ${
              dotIndex === index ? 'bg-accent-primary' : 'bg-frost/50'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
