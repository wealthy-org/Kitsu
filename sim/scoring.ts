import { COIN_VALUE } from './constants'

export function scoreFromCoins(coinsCollected: number): number {
  return coinsCollected * COIN_VALUE
}
