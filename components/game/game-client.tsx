'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useAccount, useSignMessage } from 'wagmi'
import { GameHud } from '@/components/game/hud'
import { GameScene } from '@/components/game/scene'
import { AudioSettings } from '@/components/game/audio-settings'
import { ShareIcon } from '@/components/ui/share-icon'
import { WalletPanel } from '@/components/wallet/wallet-panel'
import { useGameLoop } from '@/hooks/use-game-loop'
import { audioManager } from '@/lib/audio/audio-manager'
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
  const [countdownType, setCountdownType] = useState<'start' | 'resume'>('start')
  const pendingRef = useRef<'start' | 'resume'>('start')
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [submitMessage, setSubmitMessage] = useState<string | null>(null)
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [runId, setRunId] = useState<string | null>(null)

  const view: Phase = result && phase === 'playing' ? 'result' : phase

  useEffect(() => {
    const manager = audioManager()
    manager.playMusic('menu')
    const unlock = () => manager.unlock()
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    if (process.env.NODE_ENV !== 'production') {
      ;(window as unknown as { __kitsuAudio?: unknown }).__kitsuAudio = manager
    }
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
      manager.stopMusic()
    }
  }, [])

  useEffect(() => {
    if (!result) {
      return
    }
    if (result.completed) {
      audioManager().finish()
    } else {
      audioManager().hit()
    }
  }, [result])

  useEffect(() => {
    if (phase !== 'countdown') {
      return undefined
    }
    const deadline = performance.now() + 3000
    const id = setInterval(() => {
      const remainingMs = deadline - performance.now()
      if (remainingMs <= 0) {
        clearInterval(id)
        audioManager().go()
        if (pendingRef.current === 'start') {
          start()
        } else {
          resume()
        }
        setPhase('playing')
        return
      }
      const next = Math.ceil(remainingMs / 1000)
      setCountdown((current) => {
        if (next !== current) {
          audioManager().countdown(3 - next)
        }
        return next
      })
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
      const manager = audioManager()
      if (action === 'jump') {
        manager.bark()
      } else if (action === 'slide') {
        manager.slide()
      } else {
        manager.lane()
      }
      registerAction(action)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, pause, registerAction])

  function beginCountdown(pending: 'start' | 'resume') {
    pendingRef.current = pending
    setCountdownType(pending)
    setCountdown(3)
    setPhase('countdown')
    audioManager().playMusic('run')
    audioManager().countdown(0)
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
    audioManager().playMusic('menu')
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
          className="absolute inset-0 z-[55] flex flex-col items-center justify-center bg-void/80 backdrop-blur-[2px]"
        >
          <div className="rounded-full border border-frost/40 bg-charcoal/80 px-6 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-accent-teal shadow-card">
            {countdownType === 'resume' ? 'Resuming run' : 'Get ready'}
          </div>
          <div className="relative mt-6 flex h-36 w-36 items-center justify-center">
            <div className="absolute inset-0 animate-ping rounded-full border border-accent-primary/40 opacity-60" />
            <div className="absolute inset-1.5 rounded-full border border-frost/25 bg-charcoal/70" />
            <p className="relative font-display text-[96px] font-bold leading-none text-bone drop-shadow-[0_0_24px_rgba(99,102,241,0.5)]">
              {countdown}
            </p>
          </div>
        </div>
      )}

      {view === 'menu' && (
        <div
          data-section="play-menu"
          className="absolute inset-0 z-50 flex items-center justify-center bg-void/85 px-6 py-12"
        >
          <div className="w-full max-w-lg rounded-card border border-frost/50 bg-charcoal/90 p-8 text-center shadow-card backdrop-blur-sm">
            {/* Big placeholder KITSU wordmark logo */}
            <p className="font-display text-[72px] leading-none text-bone tracking-tight md:text-[88px]">
              KITSU
            </p>
            <h1 className="mt-4 font-display text-[22px] leading-tight text-accent-soft md:text-[26px]">
              SAME GRID.
              <br />
              PROVE THE RUN.
            </h1>
            <p className="mt-4 text-[14px] leading-relaxed text-ash">
              One course for everyone today. Practice as much as you like; nothing is submitted.
              Clear every obstacle and finish to post an official run.
            </p>

            {/* Action controls row */}
            <div className="mt-8 flex items-center justify-center gap-3">
              {/* Back to Home button with White House icon */}
              <Link
                href="/"
                aria-label="Back to home"
                title="Back to home"
                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-nav border border-frost bg-charcoal text-white transition-colors duration-200 hover:border-bone hover:bg-charcoal-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 text-white"
                >
                  <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1V9.5z" />
                </svg>
              </Link>

              {/* PLAY Button */}
              <button
                type="button"
                autoFocus
                onClick={() => beginCountdown('start')}
                className="inline-flex min-h-12 flex-1 items-center justify-center rounded-nav bg-accent-primary px-8 font-mono text-[13px] uppercase tracking-[-0.02em] text-white transition-colors duration-200 hover:bg-accent-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-void"
              >
                PLAY
              </button>

              {/* Audio Settings with Speaker Icon */}
              <AudioSettings />
            </div>

            {/* Controls summary card */}
            <div className="mt-6 rounded-nav border border-frost/30 bg-void/60 p-4 text-left">
              <p className="font-mono text-[10px] uppercase tracking-[-0.02em] text-accent-teal">
                Controls
              </p>
              <ul className="mt-2.5 grid grid-cols-2 gap-y-1.5 font-mono text-[11px] text-bone">
                <li className="flex items-center gap-2">
                  <span className="rounded border border-frost/30 bg-charcoal px-1.5 py-0.5 text-[10px] text-ash">
                    ← / →
                  </span>
                  Move lane
                </li>
                <li className="flex items-center gap-2">
                  <span className="rounded border border-frost/30 bg-charcoal px-1.5 py-0.5 text-[10px] text-ash">
                    ↑ / Space
                  </span>
                  Jump
                </li>
                <li className="flex items-center gap-2">
                  <span className="rounded border border-frost/30 bg-charcoal px-1.5 py-0.5 text-[10px] text-ash">
                    ↓ / S
                  </span>
                  Slide
                </li>
                <li className="flex items-center gap-2">
                  <span className="rounded border border-frost/30 bg-charcoal px-1.5 py-0.5 text-[10px] text-ash">
                    Esc
                  </span>
                  Pause
                </li>
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
          className="absolute inset-0 z-[58] flex items-center justify-center bg-void/85 px-6"
        >
          <div className="w-full max-w-sm rounded-card border border-frost/50 bg-charcoal/90 p-8 text-center shadow-card backdrop-blur-sm">
            <h2 className="font-display text-[32px] leading-none text-bone">GAME PAUSED</h2>
            <p className="mt-3 text-[14px] leading-relaxed text-ash">
              Take a breath. Resume when you are ready.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  autoFocus
                  onClick={beginResume}
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-nav bg-accent-primary px-5 font-mono text-[12px] uppercase tracking-[-0.02em] text-white transition-colors duration-200 hover:bg-accent-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
                >
                  Resume
                </button>
                <AudioSettings />
              </div>
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
          className="absolute inset-0 z-[58] flex items-center justify-center bg-void/85 px-6"
        >
          <div className="w-full max-w-md rounded-card border border-frost/50 bg-charcoal/90 p-8 text-center shadow-card backdrop-blur-sm">
            <h2
              className={`font-display text-[32px] leading-none ${
                result.completed ? 'text-accent-teal' : 'text-rose-400'
              }`}
            >
              {result.completed ? 'HOME AT LAST' : 'CRASHED'}
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-ash">
              {result.completed
                ? `You made it home safely in ${formatTime(result.time_ms)}.`
                : `Failed at ${Math.floor(result.distance)} m${
                    result.failure && result.failure.segment_index >= 0
                      ? ` (${(course.segments[result.failure.segment_index]?.type ?? 'obstacle').replace('_', ' ')})`
                      : ''
                  }. Try again.`}
            </p>

            <div className="mt-4 inline-flex items-center gap-4 rounded-full border border-frost/40 bg-void/60 px-5 py-2 font-mono text-[12px] uppercase tracking-[-0.02em]">
              <span className="text-ash">
                Coins: <strong className="text-accent-amber">{result.coins_collected}</strong>
              </span>
              <span className="text-frost/40">|</span>
              <span className="text-ash">
                Score: <strong className="text-accent-teal">{result.coins_collected * 10}</strong>
              </span>
            </div>

            {submitMessage && (
              <p
                className={`mt-4 text-[13px] ${submitState === 'error' ? 'text-error' : 'text-accent-teal'}`}
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
                  {submitState === 'verifying' ? 'Submitting...' : 'Submit as official run'}
                </button>
              )}
              {submitState === 'ok' && runId && (
                <a
                  href={`/api/share/${runId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center gap-2 rounded-nav border border-frost px-5 font-mono text-[12px] uppercase tracking-[-0.02em] text-bone transition-colors duration-200 hover:border-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
                >
                  <ShareIcon />
                  Share
                </a>
              )}
              {!result.completed && (
                <button
                  type="button"
                  autoFocus
                  onClick={tryAgain}
                  className="inline-flex min-h-11 items-center rounded-nav bg-accent-primary px-6 font-mono text-[12px] uppercase tracking-[-0.02em] text-white transition-colors duration-200 hover:bg-accent-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
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
