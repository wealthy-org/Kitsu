export default function PlayLoading() {
  return (
    <main className="relative h-dvh w-full overflow-hidden bg-void" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading the course</span>
      <div className="absolute inset-0 flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-card border border-frost/50 bg-charcoal/90 p-6 shadow-card">
          <div className="h-8 w-48 rounded-nav bg-frost/40 motion-safe:animate-pulse" />
          <div className="mt-4 h-4 w-full rounded-nav bg-frost/25 motion-safe:animate-pulse" />
          <div className="mt-2 h-4 w-2/3 rounded-nav bg-frost/25 motion-safe:animate-pulse" />
          <div className="mt-6 flex gap-3">
            <div className="h-11 w-28 rounded-nav bg-accent-primary/30 motion-safe:animate-pulse" />
            <div className="h-11 w-36 rounded-nav bg-frost/25 motion-safe:animate-pulse" />
          </div>
        </div>
      </div>
    </main>
  )
}
