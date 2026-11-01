import type { Rotulo } from '../../api/types'

/** Rótulo do IA (Figma 149:100 / 149:150): "Muito alta" em destaque, os demais neutros. */
export function RotuloBadge({ rotulo, className = '' }: { rotulo: Rotulo; className?: string }) {
  const tone =
    rotulo === 'Muito alta'
      ? 'border-primary-soft-border bg-primary-soft font-semibold text-chip-selected-fg'
      : 'border-line bg-chip text-fg-muted'
  return (
    <span
      className={`inline-flex w-19 shrink-0 items-center justify-center rounded-md border px-2.5 py-1.25 text-label whitespace-nowrap ${tone} ${className}`}
    >
      {rotulo}
    </span>
  )
}
