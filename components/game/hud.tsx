'use client'

import type { GameHudState } from '@/hooks/use-game-loop'

export function formatTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms))
  const minutes = Math.floor(total / 60000)
  const seconds = Math.floor((total % 60000) / 1000)
  const millis = total % 1000
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`
}

interface GameHudProps {
  hud: GameHudState
  onPause: () => void
  onResume: () => void
  onRestart: () => void
}

export function GameHud({ hud, onPause, onResume, onRestart }: GameHudProps) {
  const running = hud.status === 'running'
  const paused = hud.status === 'paused'

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-6">
      <div className="flex items-start justify-between">
        <div className="font-mono text-[10px] uppercase tracking-[-0.02em] text-frost">
          <p>Kitsu - practice run</p>
          <p className="mt-1 text-ash">Same grid. Prove the run.</p>
        </div>
        <dl className="text-right font-mono text-[11px] uppercase tracking-[-0.02em] text-frost">
          <div>
            <dt className="text-ash">Time</dt>
            <dd className="text-[26px] leading-none text-bone">{formatTime(hud.timeMs)}</dd>
          </div>
          <div className="mt-2 flex justify-end gap-4">
            <div>
              <dt className="text-ash">Coins</dt>
              <dd className="text-accent-amber">{hud.coins}</dd>
            </div>
            <div>
              <dt className="text-ash">Score</dt>
              <dd>{hud.score}</dd>
            </div>
          </div>
        </dl>
      </div>

      <div className="pointer-events-auto flex items-center gap-3">
        {running && (
          <button
            type="button"
            onClick={onPause}
            className="inline-flex min-h-11 items-center rounded-nav border border-frost px-5 font-mono text-[12px] uppercase tracking-[-0.02em] text-bone transition-colors duration-200 hover:border-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-amber"
          >
            Pause
          </button>
        )}
        {paused && (
          <button
            type="button"
            onClick={onResume}
            className="inline-flex min-h-11 items-center rounded-nav border border-frost px-5 font-mono text-[12px] uppercase tracking-[-0.02em] text-bone transition-colors duration-200 hover:border-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-amber"
          >
            Resume
          </button>
        )}
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex min-h-11 items-center rounded-nav border border-frost px-5 font-mono text-[12px] uppercase tracking-[-0.02em] text-bone transition-colors duration-200 hover:border-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-amber"
        >
          Restart
        </button>
        <p className="font-mono text-[10px] uppercase tracking-[-0.02em] text-ash">
          Keys: arrow or WASD, space to jump
        </p>
      </div>

      <p aria-live="polite" className="sr-only">
        {`Status ${hud.status}. Time ${formatTime(hud.timeMs)}. Coins ${hud.coins}. Score ${hud.score}.`}
      </p>
    </div>
  )
}
