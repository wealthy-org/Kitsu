import type { Metadata } from 'next'
import { GameClient } from '@/components/game/game-client'

export const metadata: Metadata = {
  title: 'Play - Kitsu',
  description: 'Practice today\'s identical course. Nothing is submitted in practice mode.',
}

export default function PlayPage() {
  return <GameClient />
}
