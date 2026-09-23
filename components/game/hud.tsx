'use client'

import { useEffect, useRef, useState } from 'react'
import { COIN_VALUE } from '@/sim/constants'
import type { GameHudState } from '@/hooks/use-game-loop'
import { formatTime } from '@/lib/util/format'
import { audioManager } from '@/lib/audio/audio-manager'

interface GameHudProps {
  hud: GameHudState
  onPause: () => void
}

interface CoinPopup {
  id: number
  amount: number
}

export function GameHud({ hud, onPause }: GameHudProps) {
  const [popups, setPopups] = useState<CoinPopup[]>([])
  const previousCoins = useRef(hud.coins)
  const popupId = useRef(0)

  useEffect(() => {
    if (hud.coins > previousCoins.current) {
      const gainedValue = hud.coins - previousCoins.current
      const coinCount = Math.max(1, Math.round(gainedValue / COIN_VALUE))
      const additions: CoinPopup[] = []
      for (let index = 0; index < coinCount; index += 1) {
        popupId.current += 1
        additions.push({ id: popupId.current, amount: COIN_VALUE })
        audioManager().coin(index * 0.05)
      }
      setPopups((current) => [...current, ...additions])
      const ids = new Set(additions.map((popup) => popup.id))
      const timeout = setTimeout(() => {
        setPopups((current) => current.filter((popup) => !ids.has(popup.id)))
      }, 1000)
      previousCoins.current = hud.coins
      return () => clearTimeout(timeout)
    }
    previousCoins.current = hud.coins
    return undefined
  }, [hud.coins])

  const progress =
    hud.finishDistance > 0 ? Math.min(1, Math.max(0, hud.distance / hud.finishDistance)) : 0

  return (
    <div
      data-section="play-hud"
      className="pointer-events-none absolute inset-0 flex flex-col justify-between p-6"
    >
      <div className="flex items-start justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[-0.02em] text-accent-teal">
          KITSU COURSE
        </p>

        <div className="flex items-start gap-3">
          <dl
            data-section="play-stats"
            className="rounded-card border border-frost/50 bg-charcoal/90 px-5 py-3.5 text-right shadow-card backdrop-blur-[2px]"
          >
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[-0.02em] text-ash">Time</dt>
              <dd className="font-mono text-[28px] font-bold leading-none text-bone tabular-nums md:text-[32px]">
                {formatTime(hud.timeMs)}
              </dd>
            </div>
            <div className="mt-2.5 flex justify-end items-center gap-5 font-mono text-[13px] uppercase tracking-[-0.02em]">
              <div>
                <dt className="text-[10px] text-ash">Coins</dt>
                <dd className="flex items-center justify-end gap-1.5 text-[18px] font-bold text-accent-amber md:text-[20px]">
                  <span className="inline-block h-3 w-3 rounded-full bg-amber-400 border border-amber-300 shadow-[0_0_6px_#f59e0b]" />
                  {hud.coins}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] text-ash">Score</dt>
                <dd className="text-[18px] font-bold text-accent-teal md:text-[20px]">
                  {hud.score}
                </dd>
              </div>
            </div>
          </dl>

          <button
            type="button"
            onClick={onPause}
            aria-label="Pause game"
            className="pointer-events-auto inline-flex min-h-11 items-center rounded-nav border border-frost bg-charcoal/90 px-4 font-mono text-[12px] uppercase tracking-[-0.02em] text-bone transition-colors duration-200 hover:border-bone hover:bg-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
          >
            Pause
          </button>
        </div>
      </div>

      {/* Runner progress bar stays strictly on the left side */}
      <div
        data-section="play-progress"
        className="pointer-events-none absolute left-6 top-1/2 flex -translate-y-1/2 flex-col items-center gap-2"
      >
        <span className="font-mono text-[10px] uppercase tracking-[-0.02em] text-accent-soft">Finish</span>
        <div className="relative h-60 w-2.5 overflow-hidden rounded-full bg-charcoal border border-frost/40 max-lg:h-40">
          <div
            className="absolute bottom-0 left-0 w-full rounded-full bg-gradient-to-t from-accent-primary via-indigo-400 to-accent-teal shadow-[0_0_8px_#14b8a6]"
            style={{ height: `${Math.round(progress * 100)}%` }}
          />
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[-0.02em] text-ash">
          {Math.floor(hud.distance)} m
        </span>
      </div>

      <p className="font-mono text-[10px] uppercase tracking-[-0.02em] text-ash max-lg:hidden">
        Keys: arrows or WASD to move, space to jump, down or S to slide
      </p>

      <p aria-live="polite" className="sr-only">
        {`Status ${hud.status}. Time ${formatTime(hud.timeMs)}. Coins ${hud.coins}. Score ${hud.score}.`}
      </p>

      <div className="pointer-events-none absolute left-1/2 top-[56%] z-50 h-0 w-0">
        {popups.map((popup, index) => (
          <span
            key={popup.id}
            style={{ left: `${16 + (index % 3) * 12}px` }}
            className="absolute top-0 font-mono text-[13px] uppercase tracking-[-0.02em] text-accent-amber animate-float-up"
          >
            +{popup.amount}
          </span>
        ))}
      </div>
    </div>
  )
}
