import Image from 'next/image'
import Link from 'next/link'

const PLATFORM = [
  { href: '/', label: 'Home' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/connect/wallet', label: 'Connect Wallet' },
  { href: '/play', label: 'Play Course' },
]

export function SiteFooter() {
  return (
    <footer data-section="footer" className="border-t border-frost/40">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-12 md:grid-cols-[1.4fr_1fr] md:py-16">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <div className="relative h-9 w-9 shrink-0">
              <Image
                src="/kitsu-logo.webp"
                alt="Kitsu logo"
                fill
                sizes="36px"
                className="object-contain"
              />
            </div>
            <span className="font-display text-lg tracking-[-0.01em] text-bone">Kitsu</span>
          </div>
          <p className="max-w-sm text-[14px] leading-relaxed text-ash">
            A daily skill challenge runner. The same course for everyone, every run verified on the
            server before it counts.
          </p>
        </div>

        <nav aria-label="Platform" className="flex flex-col gap-3">
          <h2 className="font-mono text-[11px] uppercase tracking-[-0.02em] text-bone">Platform</h2>
          <ul className="flex flex-col gap-2.5">
            {PLATFORM.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-[14px] text-ash transition-colors duration-150 hover:text-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="mx-auto max-w-6xl border-t border-frost/40 px-6 py-6">
        <p className="text-xs text-ash">© 2026 Kitsu. All rights reserved.</p>
      </div>
    </footer>
  )
}
