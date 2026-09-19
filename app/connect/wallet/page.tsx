import type { Metadata } from 'next'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { ProfileAccount } from '@/components/profile/profile-account'

export const metadata: Metadata = {
  title: 'Connect Wallet - Kitsu',
  description: 'Connect a wallet and sign in to submit official runs and see your history.',
}

export default function ConnectWalletPage() {
  return (
    <div className="min-h-dvh text-bone">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-display text-[40px] leading-none text-bone max-lg:text-[32px]">
          Connect wallet
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ash">
          Connect Phantom (EVM) and sign a message to prove the wallet is yours. You only need a
          wallet to submit official runs; practice stays free and wallet-free. Your signed-in history
          appears below.
        </p>
        <div className="mt-8">
          <ProfileAccount />
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
