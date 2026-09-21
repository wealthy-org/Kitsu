'use client'

export type MusicTrack = 'menu' | 'run'
export type DogSound = 'bark' | 'yip' | 'whine'

const SAMPLE_SOURCES: Record<DogSound, string> = {
  bark: '/audio/bark.wav',
  yip: '/audio/yip.wav',
  whine: '/audio/whine.wav',
}

const MUSIC_KEY = 'kitsu.audio.music'
const SFX_KEY = 'kitsu.audio.sfx'

function readVolume(key: string): number {
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) {
      return 0.5
    }
    const value = Number.parseFloat(raw)
    return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0.5
  } catch {
    return 0.5
  }
}

// One audio graph for the whole app. Two procedural music tracks (menu and run) plus effects.
// Idempotent start: a track already playing is not started twice, and StrictMode remounts are safe.
class AudioManager {
  private ctx: AudioContext | null = null
  private musicGain: GainNode | null = null
  private sfxGain: GainNode | null = null
  private trackGain: GainNode | null = null
  private track: MusicTrack | null = null
  private timer: number | null = null
  private nextNoteTime = 0
  private step = 0
  private samples = new Map<DogSound, AudioBuffer>()
  private sampleLoads = new Map<DogSound, Promise<AudioBuffer>>()
  musicVolume = 0.5
  sfxVolume = 0.5

  constructor() {
    if (typeof window !== 'undefined') {
      this.musicVolume = readVolume(MUSIC_KEY)
      this.sfxVolume = readVolume(SFX_KEY)
    }
  }

  private context(): AudioContext | null {
    if (typeof window === 'undefined') {
      return null
    }
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) {
        return null
      }
      this.ctx = new Ctor()
      this.musicGain = this.ctx.createGain()
      this.musicGain.gain.value = this.musicVolume
      this.musicGain.connect(this.ctx.destination)
      this.sfxGain = this.ctx.createGain()
      this.sfxGain.gain.value = this.sfxVolume
      this.sfxGain.connect(this.ctx.destination)
    }
    return this.ctx
  }

  unlock(): void {
    const ctx = this.context()
    if (ctx && ctx.state === 'suspended') {
      void ctx.resume()
    }
  }

  setMusicVolume(value: number): void {
    this.musicVolume = Math.min(1, Math.max(0, value))
    if (this.musicGain) {
      this.musicGain.gain.value = this.musicVolume
    }
    try {
      window.localStorage.setItem(MUSIC_KEY, String(this.musicVolume))
    } catch {
      // ignore storage failures
    }
  }

  setSfxVolume(value: number): void {
    this.sfxVolume = Math.min(1, Math.max(0, value))
    if (this.sfxGain) {
      this.sfxGain.gain.value = this.sfxVolume
    }
    try {
      window.localStorage.setItem(SFX_KEY, String(this.sfxVolume))
    } catch {
      // ignore storage failures
    }
  }

  playMusic(track: MusicTrack): void {
    this.unlock()
    if (this.track === track && this.timer !== null) {
      return
    }
    this.track = track
    this.stopTimer()
    const ctx = this.context()
    const master = this.musicGain
    if (!ctx || !master) {
      return
    }
    this.releaseTrackGain()
    const gain = ctx.createGain()
    gain.gain.value = 1
    gain.connect(master)
    this.trackGain = gain
    this.nextNoteTime = ctx.currentTime + 0.05
    this.step = 0
    this.timer = window.setInterval(() => this.schedule(), 25)
  }

  stopMusic(): void {
    this.stopTimer()
    this.track = null
    this.releaseTrackGain()
  }

  // Fades the outgoing track so notes scheduled just before a switch do not overlap the new one.
  private releaseTrackGain(): void {
    const gain = this.trackGain
    const ctx = this.ctx
    this.trackGain = null
    if (!gain || !ctx) {
      return
    }
    const now = ctx.currentTime
    gain.gain.cancelScheduledValues(now)
    gain.gain.setValueAtTime(gain.gain.value, now)
    gain.gain.linearRampToValueAtTime(0.0001, now + 0.06)
    window.setTimeout(() => gain.disconnect(), 120)
  }

  private stopTimer(): void {
    if (this.timer !== null) {
      window.clearInterval(this.timer)
      this.timer = null
    }
  }

  private schedule(): void {
    const ctx = this.ctx
    if (!ctx || !this.track) {
      return
    }
    if (ctx.state !== 'running') {
      this.nextNoteTime = ctx.currentTime + 0.05
      return
    }
    const run = this.track === 'run'
    const beat = run ? 0.214 : 0.32
    while (this.nextNoteTime < ctx.currentTime + 0.12) {
      this.playStep(this.step, this.nextNoteTime, run, beat)
      this.step = (this.step + 1) % (run ? 16 : 32)
      this.nextNoteTime += beat / 2
    }
  }

  private playStep(index: number, time: number, run: boolean, beat: number): void {
    const ctx = this.ctx
    const bus = this.trackGain
    if (!ctx || !bus) {
      return
    }
    const bassLine = run
      ? [55, 55, 82.4, 55, 61.7, 61.7, 92.5, 82.4]
      : [65.4, 65.4, 82.4, 98, 73.4, 73.4, 98, 110]
    const arp = run
      ? [220, 277.2, 329.6, 440, 329.6, 277.2, 246.9, 329.6]
      : [164.8, 196, 246.9, 196, 174.6, 220, 261.6, 220]

    const half = index % 2 === 0
    if (half) {
      this.tone(bassLine[(index / 2) % bassLine.length], time, beat * 0.42, 0.3, 'triangle', bus)
    }
    this.tone(arp[index % arp.length], time, beat * 0.18, run ? 0.16 : 0.1, 'square', bus)
    if (run && index % 4 === 0) {
      this.tone(70, time, 0.09, 0.5, 'sine', bus)
    }
    if (!run && index % 8 === 0) {
      this.tone(880, time, 0.08, 0.05, 'sine', bus)
    }
  }

  private tone(
    frequency: number,
    time: number,
    duration: number,
    gain: number,
    type: OscillatorType,
    destination: AudioNode,
  ): void {
    const ctx = this.ctx
    if (!ctx) {
      return
    }
    const osc = ctx.createOscillator()
    const env = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(frequency, time)
    env.gain.setValueAtTime(0.0001, time)
    env.gain.exponentialRampToValueAtTime(gain, time + 0.012)
    env.gain.exponentialRampToValueAtTime(0.0001, time + duration)
    osc.connect(env)
    env.connect(destination)
    osc.start(time)
    osc.stop(time + duration + 0.02)
  }

  private noise(time: number, duration: number, gain: number, filterFrom: number, filterTo: number): void {
    const ctx = this.ctx
    const bus = this.sfxGain
    if (!ctx || !bus) {
      return
    }
    const size = Math.floor(ctx.sampleRate * duration)
    const buffer = ctx.createBuffer(1, size, ctx.sampleRate)
    const channel = buffer.getChannelData(0)
    for (let i = 0; i < size; i += 1) {
      channel[i] = Math.random() * 2 - 1
    }
    const source = ctx.createBufferSource()
    source.buffer = buffer
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(filterFrom, time)
    filter.frequency.exponentialRampToValueAtTime(filterTo, time + duration)
    const env = ctx.createGain()
    env.gain.setValueAtTime(gain, time)
    env.gain.exponentialRampToValueAtTime(0.0001, time + duration)
    source.connect(filter)
    filter.connect(env)
    env.connect(bus)
    source.start(time)
    source.stop(time + duration)
  }

  countdown(step: number): void {
    this.unlock()
    const ctx = this.ctx
    if (!ctx || !this.sfxGain) {
      return
    }
    const frequencies = [660, 740, 880]
    this.tone(frequencies[Math.min(step, 2)] ?? 880, ctx.currentTime, 0.12, 0.25, 'square', this.sfxGain)
  }

  go(): void {
    this.unlock()
    const ctx = this.ctx
    if (!ctx || !this.sfxGain) {
      return
    }
    this.tone(1046, ctx.currentTime, 0.22, 0.3, 'square', this.sfxGain)
  }

  lane(): void {
    this.dogSound('yip')
  }

  // Deliberately quieter than the other effects: a course holds 25 to 30 coins, so a loud ping
  // would wear the ear out. Two rising notes read as "collection" without competing with the music.
  coin(offsetSeconds = 0): void {
    this.unlock()
    const ctx = this.ctx
    const bus = this.sfxGain
    if (!ctx || !bus) {
      return
    }
    const start = ctx.currentTime + offsetSeconds
    this.tone(987.77, start, 0.09, 0.15, 'triangle', bus)
    this.tone(1318.51, start + 0.07, 0.2, 0.13, 'triangle', bus)
  }

  slide(): void {
    this.dogSound('whine')
  }

  hit(): void {
    this.unlock()
    const ctx = this.ctx
    if (!ctx || !this.sfxGain) {
      return
    }
    this.tone(90, ctx.currentTime, 0.32, 0.4, 'sawtooth', this.sfxGain)
    this.noise(ctx.currentTime, 0.24, 0.3, 400, 90)
  }

  finish(): void {
    this.unlock()
    const ctx = this.ctx
    const bus = this.sfxGain
    if (!ctx || !bus) {
      return
    }
    const now = ctx.currentTime
    ;[523.3, 659.3, 784].forEach((frequency, index) => {
      this.tone(frequency, now + index * 0.12, 0.24, 0.28, 'triangle', bus)
    })
  }

  bark(): void {
    this.dogSound('bark')
  }

  // Dog samples are self-generated WAV files committed in public/audio: free to use, no credit.
  // A single in-flight load per sample keeps rapid presses from firing the same sound twice.
  dogSound(name: DogSound, offsetSeconds = 0): void {
    this.unlock()
    const ctx = this.ctx
    if (!ctx || !this.sfxGain) {
      return
    }
    const buffer = this.samples.get(name)
    if (buffer) {
      this.playSample(buffer, offsetSeconds)
      return
    }
    if (!this.sampleLoads.has(name)) {
      const load = fetch(SAMPLE_SOURCES[name])
        .then((response) => response.arrayBuffer())
        .then((data) => ctx.decodeAudioData(data))
        .then((decoded) => {
          this.samples.set(name, decoded)
          return decoded
        })
        .catch(() => {
          this.sampleLoads.delete(name)
          throw new Error(`${name} load failed`)
        })
      this.sampleLoads.set(name, load)
    }
    void this.sampleLoads
      .get(name)
      ?.then((decoded) => this.playSample(decoded, offsetSeconds))
      .catch(() => undefined)
  }

  private playSample(buffer: AudioBuffer, offsetSeconds: number): void {
    const ctx = this.ctx
    if (!ctx || !this.sfxGain) {
      return
    }
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(this.sfxGain)
    source.start(ctx.currentTime + offsetSeconds)
  }

  debugState(): { track: MusicTrack | null; hasContext: boolean; music: number; sfx: number } {
    return {
      track: this.track,
      hasContext: this.ctx !== null,
      music: this.musicVolume,
      sfx: this.sfxVolume,
    }
  }
}

let manager: AudioManager | null = null

export function audioManager(): AudioManager {
  if (!manager) {
    manager = new AudioManager()
  }
  return manager
}
