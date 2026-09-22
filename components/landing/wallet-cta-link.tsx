'use client'

import Link from 'next/link'
import { useSyncExternalStore } from 'react'
import { useAccount } from 'wagmi'

const subscribeNoop = () => () => undefined
const getClientSnapshot = () => true
const getServerSnapshot = () => false

// The label follows the wallet session: guests see "Connect wallet", signed-in players see
// "See profile". Both point at /connect/wallet, where disconnecting actually happens.
export function WalletCtaLink({ className }: { className: string }) {
  const { address } = useAccount()
  const mounted = useSyncExternalStore(subscribeNoop, getClientSnapshot, getServerSnapshot)
  const label = mounted && address ? 'See profile' : 'Connect wallet'

  return (
    <Link href="/connect/wallet" className={className}>
      {label}
    </Link>
  )
}
