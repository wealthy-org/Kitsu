'use client'

import { useEffect, useMemo } from 'react'
import { GameHud, formatTime } from '@/components/game/hud'
import { GameScene } from '@/components/game/scene'
import { useGameLoop } from '@/hooks/use-game-loop'
import { generateCourse } from '@/sim/course-generator'
import { dailySeed } from '@/sim/prng'
import type { InputAction } from '@/sim/types'

const KEY_MAP: Record<string, InputAction> = {
  ArrowLeft: 'left',
  a: 'left',
  ArrowRight: 'right',
  d: 'right',
  ArrowUp: 'jump',
  w: 'jump',
  ' ': 'jump',
  ArrowDown: 'slide',
  s: 'slide',
}

export function GameClient() {
  const course = useMemo(() => generateCourse(dailySeed(new Date().toISOString())), [])
  const { hud, result, stateRef, start, pause, resume, restart, registerAction } =
    useGameLoop(course)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (hud.status === 'running') {
          pause()
        } else if (hud.status === 'paused') {
          resume()
        }
        return
      }
      const action = KEY_MAP[event.key] ?? KEY_MAP[event.key.toLowerCase()]
      if (!action) {
        return
      }
      if (hud.status === 'running') {
        event.preventDefault()
        registerAction(action)
      } else if (hud.status === 'ready') {
        event.preventDefault()
        start()
        registerAction(action)
      } else if (hud.status === 'paused') {
        event.preventDefault()
        resume()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [hud.status, pause, registerAction, resume, start])

  const started = hud.status !== 'ready'

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-void">
      <GameScene course={course} stateRef={stateRef} />

      <p className="absolute left-1/2 top-4 z-50 -translate-x-1/2 rounded-nav border border-frost/20 bg-void/80 px-4 py-2 font-mono text-[10px] uppercase tracking-[-0.02em] text-accent-amber lg:hidden">
        Optimized for desktop
      </p>

      <GameHud hud={hud} onPause={pause} onResume={resume} onRestart={restart} />

      {!started && (
        <div className="absolute inset-0 flex items-center justify-center bg-void/60 px-6">
          <div className="max-w-md rounded-card border border-frost/20 bg-void/80 p-6 text-center">
            <h1 className="font-display text-[30px] leading-none text-bone">Practice run</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-ash">
              The course is identical for everyone today. Practice as much as you like; nothing is
              submitted. Jump the high barriers, slide under the low ones, and clear every gap.
            </p>
            <button
              type="button"
              onClick={start}
              className="mt-5 inline-flex min-h-11 items-center rounded-nav border border-frost bg-charcoal px-5 font-mono text-[12px] uppercase tracking-[-0.02em] text-bone transition-colors duration-200 hover:bg-charcoal-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-amber"
            >
              Start running
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className="absolute inset-0 flex items-center justify-center bg-void/70 px-6">
          <div className="max-w-md rounded-card border border-frost/20 bg-void/85 p-6 text-center">
            <h2 className="font-display text-[26px] leading-none text-bone">
              {result.completed ? 'Finish' : 'Run ended'}
            </h2>
            <p className="mt-3 text-[15px] text-ash">
              {result.completed
                ? `You reached the finish in ${formatTime(result.time_ms)}.`
                : `Failed at ${Math.floor(result.distance)} m. Try again.`}
            </p>
            <p className="mt-2 font-mono text-[12px] uppercase tracking-[-0.02em] text-frost">
              Coins {result.coins_collected} - Score {result.coins_collected * 10}
            </p>
            <button
              type="button"
              onClick={restart}
              className="mt-5 inline-flex min-h-11 items-center rounded-nav border border-frost bg-charcoal px-5 font-mono text-[12px] uppercase tracking-[-0.02em] text-bone transition-colors duration-200 hover:bg-charcoal-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-amber"
            >
              Run again
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
