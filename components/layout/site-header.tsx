'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useAccount } from 'wagmi'
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion'

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

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <circle cx="12" cy="8.5" r="3.75" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M4.5 20a7.5 7.5 0 0 1 15 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function SiteHeader() {
  const pathname = usePathname()
  const onLanding = pathname === '/'
  const reduce = usePrefersReducedMotion()
  const { address } = useAccount()
  const mounted = useSyncExternalStore(subscribeNoop, getClientSnapshot, getServerSnapshot)
  const [open, setOpen] = useState(false)
  const burgerRef = useRef<HTMLButtonElement | null>(null)
  const firstItemRef = useRef<HTMLAnchorElement | null>(null)

  useEffect(() => {
    if (!open) {
      return undefined
    }
    firstItemRef.current?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        close()
      }
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown, true)
    }
  }, [open])

  function close() {
    setOpen(false)
    burgerRef.current?.focus()
  }

  const walletClass =
    'inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-nav bg-accent-primary px-5 font-mono text-[12px] uppercase tracking-[-0.02em] text-white transition-colors duration-200 hover:bg-accent-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-void'

  const itemClass =
    'inline-flex min-h-11 w-full items-center rounded-nav px-4 font-display text-[20px] leading-tight text-bone transition-colors duration-200 hover:bg-charcoal-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary'

  return (
    <header data-section="header" className="sticky top-0 z-40 h-0">
      <button
        ref={burgerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="site-menu"
        aria-label="Open menu"
        className="fixed right-6 top-6 z-40 inline-flex h-11 w-11 flex-col items-center justify-center gap-[5px] rounded-nav text-bone transition-colors duration-200 hover:bg-charcoal-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
      >
        <span aria-hidden="true" className="block h-[2px] w-6 rounded bg-current" />
        <span aria-hidden="true" className="block h-[2px] w-6 rounded bg-current" />
        <span aria-hidden="true" className="block h-[2px] w-6 rounded bg-current" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              aria-label="Close menu"
              onClick={close}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduce === true ? 0 : 0.2 }}
              className="fixed inset-0 z-[55] bg-void/70"
            />
            <motion.div
              id="site-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Site menu"
              initial={reduce === true ? { x: 0 } : { x: '100%' }}
              animate={{ x: 0 }}
              exit={reduce === true ? { x: 0, opacity: 0 } : { x: '100%' }}
              transition={
                reduce === true
                  ? { duration: 0 }
                  : { type: 'spring', stiffness: 320, damping: 34 }
              }
              className="fixed inset-y-0 right-0 z-[60] flex w-[min(88vw,360px)] flex-col overflow-y-auto border-l border-frost/40 bg-charcoal px-6 py-6 shadow-card"
            >
              <div className="flex items-center justify-between border-b border-frost/40 pb-4">
                <Link
                  href="/"
                  onClick={close}
                  className="flex items-center gap-2.5 text-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
                >
                  <div className="relative h-8 w-8 shrink-0">
                    <Image
                      src="/kitsu-logo.webp"
                      alt="Kitsu logo"
                      fill
                      sizes="32px"
                      className="object-contain"
                    />
                  </div>
                  <span className="font-display text-[18px] tracking-tight text-bone">KITSU</span>
                </Link>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close menu"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-nav text-bone transition-colors duration-200 hover:bg-charcoal-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
                >
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-6 w-6">
                    <path
                      d="M6 6l12 12M18 6L6 18"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              <nav aria-label="Site" className="mt-4 grid content-start gap-2">
                {mounted && address ? (
                  <Link ref={firstItemRef} href="/connect/wallet" onClick={close} className={walletClass}>
                    <PersonIcon />
                    Profile
                  </Link>
                ) : (
                  <Link ref={firstItemRef} href="/connect/wallet" onClick={close} className={walletClass}>
                    Connect wallet
                  </Link>
                )}
                <Link href="/" onClick={close} className={itemClass}>
                  Home
                </Link>
                {SECTIONS.map((section) => (
                  <Link
                    key={section.id}
                    href={onLanding ? `#${section.id}` : `/#${section.id}`}
                    onClick={close}
                    className={itemClass}
                  >
                    {section.label}
                  </Link>
                ))}
                {ROUTES.map((route) => (
                  <Link
                    key={route.href}
                    href={route.href}
                    onClick={close}
                    aria-current={pathname === route.href ? 'page' : undefined}
                    className={itemClass}
                  >
                    {route.label}
                  </Link>
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  )
}
