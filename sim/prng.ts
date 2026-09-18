export function hashSeed(seed: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

export type SeededRandom = () => number

export function createRandom(seed: string | number): SeededRandom {
  let state = (typeof seed === 'number' ? seed : hashSeed(seed)) >>> 0
  return function next(): number {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function randomInt(rng: SeededRandom, min: number, maxInclusive: number): number {
  const span = maxInclusive - min + 1
  return min + Math.floor(rng() * span)
}

export function dailySeed(dateIso: string): string {
  return dateIso.slice(0, 10)
}
