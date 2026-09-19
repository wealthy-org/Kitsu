'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
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

type Phase = 'menu' | 'countdown' | 'playing' | 'paused' | 'result'
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
  const { hud, result, inputLogRef, stateRef, start, pause, resume, reset, registerAction } =
    useGameLoop(course)
  const { address } = useAccount()
  const { signMessageAsync } = useSignMessage()

  const [phase, setPhase] = useState<Phase>('menu')
  const [countdown, setCountdown] = useState(3)
  const pendingRef = useRef<'start' | 'resume'>('start')
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [submitMessage, setSubmitMessage] = useState<string | null>(null)
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [runId, setRunId] = useState<string | null>(null)

  const view: Phase = result && phase === 'playing' ? 'result' : phase

  useEffect(() => {
    if (phase !== 'countdown') {
      return undefined
    }
    const deadline = performance.now() + 3000
    const id = setInterval(() => {
      const remainingMs = deadline - performance.now()
      if (remainingMs <= 0) {
        clearInterval(id)
        if (pendingRef.current === 'start') {
          start()
        } else {
          resume()
        }
        setPhase('playing')
        return
      }
      setCountdown(Math.ceil(remainingMs / 1000))
    }, 200)
    return () => clearInterval(id)
  }, [phase, start, resume])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (view === 'playing') {
          pause()
          setPhase('paused')
        } else if (view === 'paused') {
          beginResume()
        }
        return
      }
      if (view !== 'playing') {
        return
      }
      const action = KEY_MAP[event.key] ?? KEY_MAP[event.key.toLowerCase()]
      if (!action) {
        return
      }
      event.preventDefault()
      registerAction(action)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, pause, registerAction])

  function beginCountdown(pending: 'start' | 'resume') {
    pendingRef.current = pending
    setCountdown(3)
    setPhase('countdown')
  }

  function beginResume() {
    beginCountdown('resume')
  }

  function resetSubmitState() {
    setSubmitState('idle')
    setSubmitMessage(null)
    setShowWalletModal(false)
    setRunId(null)
  }

  function backToMenu() {
    reset()
    resetSubmitState()
    setPhase('menu')
  }

  function tryAgain() {
    reset()
    resetSubmitState()
    beginCountdown('start')
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
        run_id?: string
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

      setRunId(body?.run_id ?? null)
      setSubmitState('ok')
      setSubmitMessage(
        `Verified. Rank ${body?.rank ?? '-'}${body?.is_best ? ' (best today)' : ''}.`,
      )
    } catch (error) {
      setSubmitState('error')
      setSubmitMessage(describeError(error))
    }
  }

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-void">
      <GameScene course={course} stateRef={stateRef} />

      {view === 'playing' && (
        <GameHud
          hud={hud}
          onPause={() => {
            pause()
            setPhase('paused')
          }}
        />
      )}

      {view === 'countdown' && (
        <div
          data-section="play-countdown"
          className="absolute inset-0 z-[55] flex flex-col items-center justify-center bg-void/70"
        >
          <p className="font-mono text-[12px] uppercase tracking-[-0.02em] text-accent-soft">
            Get ready
          </p>
          <p className="font-display text-[120px] font-semibold leading-none text-bone">
            {countdown}
          </p>
        </div>
      )}

      {view === 'menu' && (
        <div
          data-section="play-menu"
          className="absolute inset-0 z-50 overflow-y-auto bg-gradient-to-r from-void/95 via-void/80 to-void/30"
        >
          <div className="mx-auto flex min-h-full max-w-6xl flex-col justify-center px-8 py-12">
            <h1 className="font-display text-[56px] leading-none text-bone max-lg:text-[38px]">
              KITSU course
            </h1>
            <p className="mt-3 font-mono text-[12px] uppercase tracking-[-0.02em] text-accent-teal">
              Same grid, prove the run
            </p>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ash">
              One course for everyone today. Practice as much as you like; nothing is submitted.
              Clear every obstacle and finish to post an official run.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                autoFocus
                onClick={() => beginCountdown('start')}
                className="inline-flex min-h-11 items-center rounded-nav bg-accent-primary px-6 font-mono text-[13px] uppercase tracking-[-0.02em] text-white transition-colors duration-200 hover:bg-accent-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-void"
              >
                Play
              </button>
              <Link
                href="/"
                className="inline-flex min-h-11 items-center rounded-nav border border-frost px-6 font-mono text-[13px] uppercase tracking-[-0.02em] text-bone transition-colors duration-200 hover:border-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
              >
                Back to home
              </Link>
            </div>
            <div className="mt-8 max-w-md rounded-card border border-frost/50 bg-charcoal/85 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[-0.02em] text-ash">Controls</p>
              <ul className="mt-2 grid grid-cols-2 gap-y-1 font-mono text-[12px] text-bone">
                <li>Left / Right: change lane</li>
                <li>Up / Space: jump</li>
                <li>Down / S: slide</li>
                <li>Esc: pause</li>
              </ul>
            </div>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[-0.02em] text-ash">
              Built for desktop. Use a keyboard on a larger screen for the full run.
            </p>
          </div>
        </div>
      )}

      {view === 'paused' && (
        <div
          data-section="play-paused"
          className="absolute inset-0 z-[58] flex items-center justify-end bg-void/85 px-8"
        >
          <div className="w-full max-w-sm">
            <h2 className="font-display text-[38px] leading-none text-bone">GAME PAUSED</h2>
            <p className="mt-3 text-[14px] leading-relaxed text-ash">
              Take a breath. Resume when you are ready.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                autoFocus
                onClick={beginResume}
                className="inline-flex min-h-11 items-center justify-center rounded-nav bg-accent-primary px-5 font-mono text-[12px] uppercase tracking-[-0.02em] text-white transition-colors duration-200 hover:bg-accent-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
              >
                Resume
              </button>
              <button
                type="button"
                onClick={backToMenu}
                className="inline-flex min-h-11 items-center justify-center rounded-nav border border-frost px-5 font-mono text-[12px] uppercase tracking-[-0.02em] text-bone transition-colors duration-200 hover:border-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
              >
                Back to main screen
              </button>
            </div>
          </div>
        </div>
      )}

      {view === 'result' && result && (
        <div
          data-section="play-result"
          className="absolute inset-0 z-[58] flex items-center justify-center bg-void/80 px-6"
        >
          <div className="w-full max-w-md rounded-card border border-frost/50 bg-charcoal p-6 text-center shadow-card">
            <h2 className="font-display text-[30px] leading-none text-bone">
              {result.completed ? 'Home at last' : 'Run ended'}
            </h2>
            <p className="mt-3 text-[15px] text-ash">
              {result.completed
                ? `You made it home in ${formatTime(result.time_ms)}.`
                : `Failed at ${Math.floor(result.distance)} m${
                    result.failure && result.failure.segment_index >= 0
                      ? ` (${course.segments[result.failure.segment_index]?.type ?? 'obstacle'})`
                      : ''
                  }. Try again.`}
            </p>
            <p className="mt-2 font-mono text-[13px] uppercase tracking-[-0.02em] text-frost">
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

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {result.completed && submitState !== 'ok' && (
                <button
                  type="button"
                  autoFocus
                  disabled={submitState === 'verifying'}
                  onClick={submitRun}
                  className="inline-flex min-h-11 items-center rounded-nav bg-accent-primary px-5 font-mono text-[12px] uppercase tracking-[-0.02em] text-white transition-colors duration-200 hover:bg-accent-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary disabled:opacity-50"
                >
                  {submitState === 'verifying' ? 'Submitting' : 'Submit as official run'}
                </button>
              )}
              {submitState === 'ok' && runId && (
                <a
                  href={`/api/share/${runId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center rounded-nav border border-frost px-5 font-mono text-[12px] uppercase tracking-[-0.02em] text-bone transition-colors duration-200 hover:border-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
                >
                  Share card
                </a>
              )}
              {!result.completed && (
                <button
                  type="button"
                  onClick={tryAgain}
                  className="inline-flex min-h-11 items-center rounded-nav bg-accent-primary px-5 font-mono text-[12px] uppercase tracking-[-0.02em] text-white transition-colors duration-200 hover:bg-accent-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
                >
                  Try again
                </button>
              )}
              <Link
                href="/leaderboard"
                className="inline-flex min-h-11 items-center rounded-nav border border-frost px-5 font-mono text-[12px] uppercase tracking-[-0.02em] text-bone transition-colors duration-200 hover:border-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
              >
                View leaderboard
              </Link>
              <button
                type="button"
                onClick={backToMenu}
                className="inline-flex min-h-11 items-center rounded-nav border border-frost px-5 font-mono text-[12px] uppercase tracking-[-0.02em] text-bone transition-colors duration-200 hover:border-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
              >
                Back to main screen
              </button>
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
              className="mt-3 inline-flex min-h-11 items-center rounded-nav border border-frost px-5 font-mono text-[12px] uppercase tracking-[-0.02em] text-bone transition-colors duration-200 hover:border-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
