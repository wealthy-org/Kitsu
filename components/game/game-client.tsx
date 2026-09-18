'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { GameHud } from '@/components/game/hud'
import { GameScene } from '@/components/game/scene'
import { useGameLoop } from '@/hooks/use-game-loop'
import { buildRunNonceMessage } from '@/lib/auth/run-nonce-message'
import { formatTime } from '@/lib/util/format'
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

type SubmitState = 'idle' | 'submitting' | 'ok' | 'error' | 'needs-session'

export function GameClient() {
  const course = useMemo(() => generateCourse(dailySeed(new Date().toISOString())), [])
  const { hud, result, inputLogRef, stateRef, start, pause, resume, restart, registerAction } =
    useGameLoop(course)
  const { address } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [submitMessage, setSubmitMessage] = useState<string | null>(null)

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

  function resetSubmitState() {
    setSubmitState('idle')
    setSubmitMessage(null)
  }

  async function submitRun() {
    if (!result?.completed) {
      return
    }
    if (!address) {
      setSubmitState('needs-session')
      setSubmitMessage('Connect a wallet and sign in from Profile first.')
      return
    }
    setSubmitState('submitting')
    setSubmitMessage(null)
    try {
      const nonceResponse = await fetch(`/api/wallet/nonce?wallet=${address}&purpose=submit`)
      if (!nonceResponse.ok) {
        setSubmitState('needs-session')
        setSubmitMessage('Wallet not recognised. Sign in from Profile first.')
        return
      }
      const { nonce } = (await nonceResponse.json()) as { nonce: string }
      const signature = await signMessageAsync({
        message: buildRunNonceMessage(address, nonce),
      })
      const response = await fetch('/api/run/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          daily_seed: course.seed,
          input_log: inputLogRef.current,
          claimed_time_ms: result.time_ms,
          claimed_score: result.coins_collected * 10,
          nonce,
          signature,
        }),
      })
      const body = (await response.json()) as {
        rank?: number | null
        is_best?: boolean
        error?: { message?: string }
      }
      if (response.status === 401) {
        setSubmitState('needs-session')
        setSubmitMessage('Sign in from Profile first.')
        return
      }
      if (!response.ok) {
        setSubmitState('error')
        setSubmitMessage(body.error?.message ?? 'Submission was rejected.')
        return
      }
      setSubmitState('ok')
      setSubmitMessage(
        `Verified. Rank ${body.rank ?? '-'}${body.is_best ? ' (best today)' : ''}.`,
      )
    } catch {
      setSubmitState('error')
      setSubmitMessage('Submission failed. Try again.')
    }
  }

  const started = hud.status !== 'ready'

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-void">
      <GameScene course={course} stateRef={stateRef} />

      <GameHud hud={hud} onPause={pause} onResume={resume} onRestart={restart} />

      <p className="absolute left-1/2 top-4 z-50 -translate-x-1/2 rounded-nav border border-frost/20 bg-void/80 px-4 py-2 font-mono text-[10px] uppercase tracking-[-0.02em] text-accent-amber lg:hidden">
        Optimized for desktop
      </p>

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

            {submitMessage && (
              <p
                className={`mt-3 text-[13px] ${submitState === 'ok' ? 'text-accent-teal' : 'text-error'}`}
                role="status"
              >
                {submitMessage}
              </p>
            )}

            <div className="mt-5 flex flex-wrap justify-center gap-3">
              {result.completed && submitState !== 'ok' && (
                <button
                  type="button"
                  disabled={submitState === 'submitting'}
                  onClick={submitRun}
                  className="inline-flex min-h-11 items-center rounded-nav border border-frost bg-charcoal px-5 font-mono text-[12px] uppercase tracking-[-0.02em] text-bone transition-colors duration-200 hover:bg-charcoal-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-amber disabled:opacity-50"
                >
                  {submitState === 'submitting' ? 'Submitting' : 'Submit as official run'}
                </button>
              )}
              {submitState === 'needs-session' && (
                <a
                  href="/profile"
                  className="inline-flex min-h-11 items-center rounded-nav border border-frost px-5 font-mono text-[12px] uppercase tracking-[-0.02em] text-bone transition-colors duration-200 hover:border-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-amber"
                >
                  Go to profile
                </a>
              )}
              <button
                type="button"
                onClick={() => {
                  resetSubmitState()
                  restart()
                }}
                className="inline-flex min-h-11 items-center rounded-nav border border-frost bg-charcoal px-5 font-mono text-[12px] uppercase tracking-[-0.02em] text-bone transition-colors duration-200 hover:bg-charcoal-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-amber"
              >
                Run again
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
