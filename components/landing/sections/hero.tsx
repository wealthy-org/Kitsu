import Image from 'next/image'

export function Hero() {
  return (
    <section id="hero" data-section="hero" className="relative overflow-hidden border-b border-frost/40">
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <Image
          src="/course-preview/hero-bg.webp"
          alt="Kitsu Cyber Course"
          fill
          priority
          sizes="100vw"
          className="pointer-events-none object-cover"
        />
        <div className="absolute inset-0 bg-void/50" />
      </div>
      <div className="pointer-events-none relative mx-auto flex min-h-svh max-w-6xl flex-col items-center justify-center px-6 py-24 text-center">
        <div className="flex flex-col items-center">
          <div className="relative mb-4 h-40 w-40 drop-shadow-[0_8px_24px_rgba(0,0,0,0.6)] md:h-56 md:w-56">
            <Image
              src="/kitsu-logo.webp"
              alt="Kitsu logo"
              fill
              priority
              sizes="(max-width: 768px) 160px, 224px"
              className="object-contain"
            />
          </div>
          <p className="font-display text-[26px] leading-none tracking-[0.2em] text-bone md:text-[34px]">
            KITSU
          </p>
        </div>
        <h1 className="mt-5 font-display text-[32px] leading-[0.95] text-accent-soft md:text-[44px]">
          SAME GRID.
          <br />
          PROVE THE RUN.
        </h1>
        <a
          href="/play"
          className="pointer-events-auto mt-8 inline-flex min-h-11 items-center rounded-nav bg-accent-primary px-6 font-mono text-[12px] uppercase tracking-[-0.02em] text-white transition-colors duration-200 hover:bg-accent-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-void"
        >
          Play today&apos;s course
        </a>

        <a
          href="#about"
          aria-label="Scroll to About"
          className="pointer-events-auto absolute bottom-8 left-1/2 inline-flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full border border-bone/60 text-bone transition-colors duration-200 hover:bg-void/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-6 w-6">
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      </div>
    </section>
  )
}
