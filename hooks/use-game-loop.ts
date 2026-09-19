'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { TICK_MS } from '@/sim/constants'
import { createRunState, stepRun, type RunState } from '@/sim/run'
import { scoreFromCoins } from '@/sim/scoring'
import type { Course, InputAction, InputLog, RunResult } from '@/sim/types'

export type GameStatus = 'ready' | 'running' | 'paused' | 'finished' | 'failed'

export interface GameHudState {
  timeMs: number
  coins: number
  score: number
  distance: number
  finishDistance: number
  status: GameStatus
}

export interface GameLoop {
  hud: GameHudState
  result: RunResult | null
  inputLogRef: React.RefObject<InputLog>
  stateRef: React.RefObject<RunState>
  start: () => void
  pause: () => void
  resume: () => void
  restart: () => void
  reset: () => void
  registerAction: (action: InputAction) => void
}

function toResult(state: RunState): RunResult {
  return {
    completed: state.status === 'finished',
    time_ms: (state.tick + 1) * TICK_MS,
    coins_collected: state.coinsCollected,
    distance: state.distance,
    failure: state.failure,
  }
}

export function useGameLoop(course: Course): GameLoop {
  const stateRef = useRef<RunState>(createRunState(course))
  const inputLogRef = useRef<InputLog>([])
  const pendingRef = useRef<InputAction[]>([])
  const rafRef = useRef<number | null>(null)
  const lastRef = useRef(0)
  const accRef = useRef(0)
  const statusRef = useRef<GameStatus>('ready')
  const hudCounterRef = useRef(0)

  const [hud, setHud] = useState<GameHudState>({
    timeMs: 0,
    coins: 0,
    score: 0,
    distance: 0,
    finishDistance: course.finish_distance,
    status: 'ready',
  })
  const [result, setResult] = useState<RunResult | null>(null)

  const publishHud = useCallback(() => {
    const state = stateRef.current
    setHud({
      timeMs: state.tick * TICK_MS,
      coins: state.coinsCollected,
      score: scoreFromCoins(state.coinsCollected),
      distance: state.distance,
      finishDistance: course.finish_distance,
      status: statusRef.current,
    })
  }, [course])

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const frame = useCallback(
    function loop(now: number) {
      if (statusRef.current !== 'running') {
        return
      }
      const delta = Math.min(now - lastRef.current, 250)
      lastRef.current = now
      accRef.current += delta

      while (accRef.current >= TICK_MS && statusRef.current === 'running') {
        const state = stateRef.current
        const actions = pendingRef.current
        for (const action of actions) {
          inputLogRef.current.push({ tick: state.tick, action })
        }
        pendingRef.current = []
        stepRun(course, state, actions)
        accRef.current -= TICK_MS
        hudCounterRef.current += 1

        if (state.status !== 'running') {
          statusRef.current = state.status === 'finished' ? 'finished' : 'failed'
          setResult(toResult(state))
          publishHud()
          stopLoop()
          return
        }
        if (hudCounterRef.current >= 5) {
          hudCounterRef.current = 0
          publishHud()
        }
      }

      if (statusRef.current === 'running') {
        rafRef.current = requestAnimationFrame(loop)
      }
    },
    [course, publishHud, stopLoop],
  )

  const start = useCallback(() => {
    stopLoop()
    stateRef.current = createRunState(course)
    inputLogRef.current = []
    pendingRef.current = []
    accRef.current = 0
    hudCounterRef.current = 0
    setResult(null)
    statusRef.current = 'running'
    lastRef.current = performance.now()
    publishHud()
    rafRef.current = requestAnimationFrame(frame)
  }, [course, frame, publishHud, stopLoop])

  const pause = useCallback(() => {
    if (statusRef.current !== 'running') {
      return
    }
    statusRef.current = 'paused'
    stopLoop()
    publishHud()
  }, [publishHud, stopLoop])

  const resume = useCallback(() => {
    if (statusRef.current !== 'paused') {
      return
    }
    statusRef.current = 'running'
    lastRef.current = performance.now()
    publishHud()
    rafRef.current = requestAnimationFrame(frame)
  }, [frame, publishHud])

  const registerAction = useCallback((action: InputAction) => {
    pendingRef.current.push(action)
  }, [])

  const reset = useCallback(() => {
    stopLoop()
    stateRef.current = createRunState(course)
    inputLogRef.current = []
    pendingRef.current = []
    accRef.current = 0
    hudCounterRef.current = 0
    setResult(null)
    statusRef.current = 'ready'
    publishHud()
  }, [course, publishHud, stopLoop])

  useEffect(() => stopLoop, [stopLoop])

  return {
    hud,
    result,
    inputLogRef,
    stateRef,
    start,
    pause,
    resume,
    restart: start,
    reset,
    registerAction,
  }
}
