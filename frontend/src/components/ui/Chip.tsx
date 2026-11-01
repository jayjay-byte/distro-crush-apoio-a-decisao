import { Check } from 'lucide-react'
import type { ReactNode } from 'react'

type ChipProps = {
  /** `selected`: chip roxo com ✓ (Figma 63:30); `neutral`: chip cinza (Figma 10:23370). */
  variant?: 'selected' | 'neutral'
  className?: string
  children: ReactNode
}

/** Chip só de leitura: distros do 1º grupo, filtros aplicados, estado do relatório. */
export function Chip({ variant = 'selected', className = '', children }: ChipProps) {
  const tone =
    variant === 'selected'
      ? 'border-primary-soft-border bg-primary-soft font-semibold text-chip-selected-fg'
      : 'border-line bg-chip text-fg-muted'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.25 text-label whitespace-nowrap ${tone} ${className}`}
    >
      {variant === 'selected' && <Check aria-hidden className="size-3" />}
      {children}
    </span>
  )
}
