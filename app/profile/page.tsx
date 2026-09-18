import type { Metadata } from 'next'
import Link from 'next/link'
import { WalletPanel } from '@/components/wallet/wallet-panel'

export const metadata: Metadata = {
  title: 'Profile - Kitsu',
  description: 'Connect a wallet and manage your session.',
}

export default function ProfilePage() {
  return (
    <main className="min-h-dvh bg-void px-6 py-16 text-bone">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="font-mono text-[11px] uppercase tracking-[-0.02em] text-accent-teal underline-offset-4 hover:underline"
        >
          Kitsu
        </Link>
        <h1 className="mt-6 font-display text-[48px] leading-none text-bone max-lg:text-[36px]">
          Profile
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-ash">
          Your wallet identity for official runs. Run history and status live here once submissions
          are available.
        </p>
        <div className="mt-8">
          <WalletPanel />
        </div>
      </div>
    </main>
  )
}
