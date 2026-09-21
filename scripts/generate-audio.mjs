// Generates the dog sound effects in public/audio: bark.wav, yip.wav, whine.wav.
// Self-generated, no third-party recording: free to use, no attribution. Run with:
// node scripts/generate-audio.mjs
import { mkdirSync, writeFileSync } from 'node:fs'

const SAMPLE_RATE = 44100

function writeWav(path, data) {
  const samples = data.length
  const buffer = Buffer.alloc(44 + samples * 2)
  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + samples * 2, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(1, 22)
  buffer.writeUInt32LE(SAMPLE_RATE, 24)
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28)
  buffer.writeUInt16LE(2, 32)
  buffer.writeUInt16LE(16, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(samples * 2, 40)
  for (let i = 0; i < samples; i += 1) {
    const clamped = Math.max(-1, Math.min(1, data[i]))
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2)
  }
  writeFileSync(path, buffer)
  console.log(`wrote ${path} (${buffer.length} bytes)`)
}

function render(duration, shape) {
  const samples = Math.floor(SAMPLE_RATE * duration)
  const data = new Float32Array(samples)
  for (let i = 0; i < samples; i += 1) {
    data[i] = shape(i / SAMPLE_RATE, i / samples)
  }
  return data
}

// A woof: pitch drops from 420 Hz, with grit and a short noise burst.
const bark = render(0.28, (t, p) => {
  const env = Math.exp(-p * 7)
  const base = 420 - p * 220
  const wobble = Math.sin(2 * Math.PI * 28 * t) * 30
  const tone = Math.sin(2 * Math.PI * (base + wobble) * t)
  const grit = Math.sin(2 * Math.PI * (base * 2.02) * t) * 0.3
  const noise = (Math.random() * 2 - 1) * 0.35 * Math.exp(-p * 14)
  return (tone * 0.6 + grit + noise) * env * 0.9
})

// A yip: short, high, rises then falls, for a lane change.
const yip = render(0.16, (t, p) => {
  const env = Math.min(1, p * 12) * Math.exp(-p * 9)
  const base = 760 + Math.sin(Math.PI * Math.min(1, p * 1.6)) * 620 - p * 180
  const tone = Math.sin(2 * Math.PI * base * t)
  const upper = Math.sin(2 * Math.PI * base * 2 * t) * 0.28
  const noise = (Math.random() * 2 - 1) * 0.18 * Math.exp(-p * 9)
  return (tone * 0.65 + upper + noise) * env * 0.75
})

// A whine: descending, with vibrato, for a slide.
const whine = render(0.52, (t, p) => {
  const env = Math.min(1, p * 6) * Math.exp(-Math.max(0, p - 0.55) * 7)
  const vibrato = Math.sin(2 * Math.PI * 6 * t) * 22
  const base = 720 - p * 340 + vibrato
  const tone = Math.sin(2 * Math.PI * base * t)
  const upper = Math.sin(2 * Math.PI * base * 2.5 * t) * 0.22
  const breath = (Math.random() * 2 - 1) * 0.12 * Math.exp(-p * 2.5)
  return (tone * 0.6 + upper + breath) * env * 0.7
})

mkdirSync('public/audio', { recursive: true })
writeWav('public/audio/bark.wav', bark)
writeWav('public/audio/yip.wav', yip)
writeWav('public/audio/whine.wav', whine)
