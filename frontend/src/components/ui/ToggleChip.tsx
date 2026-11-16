import { Check } from 'lucide-react'
import type { InputHTMLAttributes } from 'react'

type ToggleChipProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string
}

/** Chip de escolha única (Figma 10:22868): nível, arquitetura e tarefa específica. */
export function ToggleChip({ label, checked, className = '', ...props }: ToggleChipProps) {
  return (
    <label
      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-line bg-chip px-2.5 py-1.25 text-label text-fg-muted transition hover:border-primary-soft-border has-checked:border-primary-soft-border has-checked:bg-primary-soft has-checked:font-semibold has-checked:text-chip-selected-fg has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent has-disabled:cursor-not-allowed has-disabled:opacity-50 has-disabled:hover:border-line ${className}`}
    >
      <input type="radio" className="sr-only" checked={checked} {...props} />
      {checked && <Check aria-hidden className="size-3" />}
      {label}
    </label>
  )
}
