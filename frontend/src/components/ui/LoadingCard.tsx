import { LoaderCircle } from 'lucide-react'

/** Carregamento de uma seção: spinner + texto, com `role="status"`. */
export function LoadingCard({ children = 'Carregando…', className = '' }: { children?: string; className?: string }) {
  return (
    <div
      role="status"
      className={`flex items-center justify-center gap-2 rounded-lg border border-line bg-card p-8 text-body text-fg-muted ${className}`}
    >
      <LoaderCircle aria-hidden className="size-5 animate-spin text-accent" />
      {children}
    </div>
  )
}
