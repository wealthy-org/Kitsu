'use client'

import { useEffect, useRef, useState } from 'react'
import { useAudioSettings } from '@/hooks/use-audio-settings'

export function AudioSettings() {
  const { music, sfx, setMusic, setSfx } = useAudioSettings()
  const [open, setOpen] = useState(false)
  const closeRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!open) {
      return undefined
    }
    closeRef.current?.focus()
    // Capture phase: intercept Escape before the game's window listener can unpause.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return
      }
      event.stopImmediatePropagation()
      setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Audio settings"
        title="Audio settings"
        className="pointer-events-auto inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-nav border border-frost bg-charcoal/85 text-white transition-colors duration-200 hover:bg-charcoal-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.98 19.3a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.7 8.98a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1.03-1.56V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9c.26.63.86 1.03 1.56 1.03H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1Z" />
        </svg>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Audio settings"
          className="fixed inset-0 z-[70] flex items-center justify-center bg-void/85 px-6"
        >
          <div className="w-full max-w-sm rounded-card border border-frost/50 bg-charcoal p-6 shadow-card">
            <h2 className="font-display text-[24px] leading-none text-bone">Audio settings</h2>

            <label className="mt-5 block font-mono text-[11px] uppercase tracking-[-0.02em] text-ash">
              Music · {Math.round(music * 100)}%
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(music * 100)}
                onChange={(event) => setMusic(Number(event.target.value) / 100)}
                className="mt-2 w-full accent-accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
              />
            </label>

            <label className="mt-4 block font-mono text-[11px] uppercase tracking-[-0.02em] text-ash">
              Effects · {Math.round(sfx * 100)}%
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(sfx * 100)}
                onChange={(event) => setSfx(Number(event.target.value) / 100)}
                className="mt-2 w-full accent-accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
              />
            </label>

            <button
              type="button"
              ref={closeRef}
              onClick={() => setOpen(false)}
              className="mt-6 inline-flex min-h-11 items-center rounded-nav bg-accent-primary px-5 font-mono text-[12px] uppercase tracking-[-0.02em] text-white transition-colors duration-200 hover:bg-accent-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}
