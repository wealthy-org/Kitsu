'use client'

import { useState } from 'react'
import { RunHistory } from '@/components/profile/run-history'
import { WalletPanel } from '@/components/wallet/wallet-panel'

export function ProfileAccount() {
  const [sessionVersion, setSessionVersion] = useState(0)

  return (
    <>
      <WalletPanel onSignedIn={() => setSessionVersion((value) => value + 1)} />
      <RunHistory sessionVersion={sessionVersion} />
    </>
  )
}
