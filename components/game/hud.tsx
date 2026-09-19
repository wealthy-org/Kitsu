'use client'

import { useEffect, useRef, useState } from 'react'
import { COIN_VALUE } from '@/sim/constants'
import type { GameHudState } from '@/hooks/use-game-loop'
import { formatTime } from '@/lib/util/format'

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
      const gained = hud.coins - previousCoins.current
      const additions: CoinPopup[] = []
      for (let index = 0; index < gained; index += 1) {
        popupId.current += 1
        additions.push({ id: popupId.current, amount: COIN_VALUE })
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
        <p className="font-mono text-[11px] uppercase tracking-[-0.02em] text-accent-soft">
          KITSU course
        </p>

        <div className="flex items-start gap-3">
          <dl
            data-section="play-stats"
            className="rounded-card border border-frost/50 bg-charcoal/85 px-5 py-4 text-right shadow-card"
          >
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[-0.02em] text-ash">Time</dt>
              <dd className="font-display text-[34px] font-semibold leading-none text-bone max-lg:text-[24px]">
                {formatTime(hud.timeMs)}
              </dd>
            </div>
            <div className="mt-3 flex justify-end gap-5 font-mono text-[13px] uppercase tracking-[-0.02em]">
              <div>
                <dt className="text-[10px] text-ash">Coins</dt>
                <dd className="text-[18px] font-semibold text-accent-amber max-lg:text-[15px]">
                  {hud.coins}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] text-ash">Score</dt>
                <dd className="text-[18px] font-semibold text-accent-teal max-lg:text-[15px]">
                  {hud.score}
                </dd>
              </div>
            </div>
          </dl>

          <button
            type="button"
            onClick={onPause}
            className="pointer-events-auto inline-flex min-h-11 items-center rounded-nav border border-frost bg-charcoal/85 px-4 font-mono text-[12px] uppercase tracking-[-0.02em] text-bone transition-colors duration-200 hover:bg-charcoal-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
          >
            Pause
          </button>
        </div>
      </div>

      <div
        data-section="play-progress"
        className="pointer-events-none absolute left-6 top-1/2 flex -translate-y-1/2 flex-col items-center gap-2"
      >
        <span className="font-mono text-[10px] uppercase tracking-[-0.02em] text-ash">Finish</span>
        <div className="relative h-64 w-2.5 overflow-hidden rounded-full bg-frost/40 max-lg:h-40">
          <div
            className="absolute bottom-0 left-0 w-full rounded-full bg-gradient-to-t from-accent-primary to-accent-teal"
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
