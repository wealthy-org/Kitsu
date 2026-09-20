'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSyncExternalStore } from 'react'
import { useAccount, useDisconnect } from 'wagmi'

const SECTIONS = [
  { id: 'about', label: 'About' },
  { id: 'today', label: 'Today' },
  { id: 'how', label: 'How it works' },
  { id: 'faq', label: 'FAQ' },
]

const ROUTES = [
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/play', label: 'Play Course' },
]

const subscribeNoop = () => () => undefined
const getClientSnapshot = () => true
const getServerSnapshot = () => false

function ExitIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M15 3h4a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path d="M10 17l5-5-5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M15 12H3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const onLanding = pathname === '/'
  const { address } = useAccount()
  const { disconnect } = useDisconnect()
  const mounted = useSyncExternalStore(subscribeNoop, getClientSnapshot, getServerSnapshot)

  async function handleExit() {
    try {
      await fetch('/api/wallet/logout', { method: 'POST' })
    } catch {
      // The wallet still disconnects even if the session call fails.
    }
    disconnect()
    router.push('/')
  }

  return (
    <header
      data-section="header"
      className="sticky top-0 z-40 border-b border-frost/40 bg-void/80 backdrop-blur"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-[15px] tracking-[-0.01em] text-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
        >
          <span className="h-3 w-3 rotate-45 bg-accent-primary" aria-hidden="true" />
          KITSU
        </Link>

        <nav aria-label="Primary" className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {SECTIONS.map((section) => (
            <Link
              key={section.id}
              href={onLanding ? `#${section.id}` : `/#${section.id}`}
              className="font-mono text-[11px] uppercase tracking-[-0.02em] text-ash transition-colors duration-200 hover:text-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
            >
              {section.label}
            </Link>
          ))}
          {ROUTES.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              aria-current={pathname === route.href ? 'page' : undefined}
              className={`font-mono text-[11px] uppercase tracking-[-0.02em] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary ${
                pathname === route.href ? 'text-accent-primary' : 'text-ash hover:text-bone'
              }`}
            >
              {route.label}
            </Link>
          ))}

          {mounted ? (
            address ? (
              <button
                type="button"
                onClick={handleExit}
                aria-label="Disconnect wallet"
                title="Disconnect wallet"
                className="inline-flex h-9 min-h-9 items-center justify-center rounded-nav bg-accent-primary px-3 text-white transition-colors duration-200 hover:bg-accent-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-void"
              >
                <ExitIcon />
              </button>
            ) : (
              <Link
                href="/connect/wallet"
                className="inline-flex min-h-9 items-center rounded-nav bg-accent-primary px-4 font-mono text-[11px] uppercase tracking-[-0.02em] text-white transition-colors duration-200 hover:bg-accent-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-void"
              >
                Connect Wallet
              </Link>
            )
          ) : (
            <span className="block h-9 w-9" aria-hidden="true" />
          )}
        </nav>
      </div>
    </header>
  )
}
