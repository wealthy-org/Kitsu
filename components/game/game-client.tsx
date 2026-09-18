'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useAccount, useSignMessage } from 'wagmi'
import { GameHud } from '@/components/game/hud'
import { GameScene } from '@/components/game/scene'
import { WalletPanel } from '@/components/wallet/wallet-panel'
import { useGameLoop } from '@/hooks/use-game-loop'
import { buildRunNonceMessage } from '@/lib/auth/run-nonce-message'
import { formatTime } from '@/lib/util/format'
import { signMessageWithFallback } from '@/lib/wallet/sign'
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

type SubmitState = 'idle' | 'verifying' | 'ok' | 'error' | 'needs-session'

function describeError(error: unknown): string {
  if (error && typeof error === 'object') {
    const candidate = error as { shortMessage?: string; message?: string }
    return candidate.shortMessage ?? candidate.message ?? 'Submission failed.'
  }
  return 'Submission failed.'
}

export function GameClient() {
  const course = useMemo(() => generateCourse(dailySeed(new Date().toISOString())), [])
  const { hud, result, inputLogRef, stateRef, start, pause, resume, restart, registerAction } =
    useGameLoop(course)
  const { address } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [submitMessage, setSubmitMessage] = useState<string | null>(null)
  const [showWalletModal, setShowWalletModal] = useState(false)

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
    setShowWalletModal(false)
  }

  async function submitRun() {
    if (!result?.completed) {
      return
    }
    if (!address) {
      setSubmitState('needs-session')
      setSubmitMessage('Connect a wallet and sign in to submit.')
      setShowWalletModal(true)
      return
    }

    setSubmitState('verifying')
    setSubmitMessage('Submitting, verifying...')
    try {
      const verifyResponse = await fetch('/api/run/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ daily_seed: course.seed, input_log: inputLogRef.current }),
      })
      if (!verifyResponse.ok) {
        setSubmitState('error')
        setSubmitMessage(`Verification failed (${verifyResponse.status}).`)
        return
      }
      const verified = (await verifyResponse.json()) as {
        completed: boolean
        time_ms: number | null
        score: number
      }
      if (!verified.completed || verified.time_ms === null) {
        setSubmitState('error')
        setSubmitMessage('Run did not reach the finish.')
        return
      }

      const nonceResponse = await fetch(`/api/wallet/nonce?wallet=${address}&purpose=submit`)
      if (!nonceResponse.ok) {
        setSubmitState('error')
        setSubmitMessage(`Nonce request failed (${nonceResponse.status}).`)
        return
      }
      const { nonce } = (await nonceResponse.json()) as { nonce: string }
      const signature = await signMessageWithFallback(
        buildRunNonceMessage(address, nonce),
        address,
        signMessageAsync,
      )

      const response = await fetch('/api/run/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          daily_seed: course.seed,
          input_log: inputLogRef.current,
          claimed_time_ms: verified.time_ms,
          claimed_score: verified.score,
          nonce,
          signature,
        }),
      })
      const body = (await response.json().catch(() => null)) as {
        rank?: number | null
        is_best?: boolean
        error?: { message?: string }
      } | null

      if (response.status === 401) {
        setSubmitState('needs-session')
        setSubmitMessage('Sign in to submit your run.')
        setShowWalletModal(true)
        return
      }
      if (!response.ok) {
        setSubmitState('error')
        setSubmitMessage(body?.error?.message ?? `Submission failed (${response.status}).`)
        return
      }

      setSubmitState('ok')
      setSubmitMessage(
        `Verified. Rank ${body?.rank ?? '-'}${body?.is_best ? ' (best today)' : ''}.`,
      )
    } catch (error) {
      setSubmitState('error')
      setSubmitMessage(describeError(error))
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
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={start}
                className="inline-flex min-h-11 items-center rounded-nav border border-frost bg-charcoal px-5 font-mono text-[12px] uppercase tracking-[-0.02em] text-bone transition-colors duration-200 hover:bg-charcoal-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-amber"
              >
                Start running
              </button>
              <Link
                href="/"
                className="inline-flex min-h-11 items-center rounded-nav border border-frost px-5 font-mono text-[12px] uppercase tracking-[-0.02em] text-bone transition-colors duration-200 hover:border-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-amber"
              >
                Back to home
              </Link>
            </div>
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
                : `Failed at ${Math.floor(result.distance)} m${
                    result.failure && result.failure.segment_index >= 0
                      ? ` (${course.segments[result.failure.segment_index]?.type ?? 'obstacle'})`
                      : ''
                  }. Try again.`}
            </p>
            <p className="mt-2 font-mono text-[12px] uppercase tracking-[-0.02em] text-frost">
              Coins {result.coins_collected} - Score {result.coins_collected * 10}
            </p>

            {submitMessage && (
              <p
                className={`mt-3 text-[13px] ${submitState === 'error' ? 'text-error' : 'text-accent-teal'}`}
                role="status"
              >
                {submitMessage}
              </p>
            )}

            <div className="mt-5 flex flex-wrap justify-center gap-3">
              {result.completed && submitState !== 'ok' && (
                <button
                  type="button"
                  disabled={submitState === 'verifying'}
                  onClick={submitRun}
                  className="inline-flex min-h-11 items-center rounded-nav border border-frost bg-charcoal px-5 font-mono text-[12px] uppercase tracking-[-0.02em] text-bone transition-colors duration-200 hover:bg-charcoal-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-amber disabled:opacity-50"
                >
                  {submitState === 'verifying' ? 'Submitting' : 'Submit as official run'}
                </button>
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
              <Link
                href="/"
                className="inline-flex min-h-11 items-center rounded-nav border border-frost px-5 font-mono text-[12px] uppercase tracking-[-0.02em] text-bone transition-colors duration-200 hover:border-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-amber"
              >
                Back to home
              </Link>
            </div>
          </div>
        </div>
      )}

      {showWalletModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="absolute inset-0 z-[60] flex items-center justify-center bg-void/85 px-6"
        >
          <div className="w-full max-w-md">
            <WalletPanel
              onSignedIn={() => {
                setShowWalletModal(false)
                void submitRun()
              }}
            />
            <button
              type="button"
              onClick={() => setShowWalletModal(false)}
              className="mt-3 inline-flex min-h-11 items-center rounded-nav border border-frost px-5 font-mono text-[12px] uppercase tracking-[-0.02em] text-bone transition-colors duration-200 hover:border-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-amber"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
