export function BorderBeam({ className }: { className?: string }) {
  return <span aria-hidden="true" className={`beam-ring ${className ?? ''}`} />
}
