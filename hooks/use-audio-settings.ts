'use client'

import { useCallback, useSyncExternalStore } from 'react'
import { audioManager } from '@/lib/audio/audio-manager'

const listeners = new Set<() => void>()

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function notify(): void {
  for (const listener of listeners) {
    listener()
  }
}

function getSnapshot(): string {
  const manager = audioManager()
  return `${manager.musicVolume}:${manager.sfxVolume}`
}

function getServerSnapshot(): string {
  return '0.5:0.5'
}

export function useAudioSettings() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const [musicRaw, sfxRaw] = snapshot.split(':')
  const music = Number.parseFloat(musicRaw)
  const sfx = Number.parseFloat(sfxRaw)

  const setMusic = useCallback((value: number) => {
    audioManager().setMusicVolume(value)
    notify()
  }, [])

  const setSfx = useCallback((value: number) => {
    audioManager().setSfxVolume(value)
    notify()
  }, [])

  return { music, sfx, setMusic, setSfx }
}
