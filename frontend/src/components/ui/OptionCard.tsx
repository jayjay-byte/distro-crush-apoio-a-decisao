import { Check, type LucideIcon } from 'lucide-react'
import type { InputHTMLAttributes } from 'react'

type OptionCardProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'title'> & {
  type: 'radio' | 'checkbox'
  icon: LucideIcon
  title: string
  description?: string
}

/**
 * Opção em card (Figma 10:22822): ícone, título, descrição e indicador de
 * seleção. `radio` para escolha única, `checkbox` para múltipla (ajuda).
 */
export function OptionCard({ type, icon: Icon, title, description, className = '', ...props }: OptionCardProps) {
  return (
    <label
      className={`group flex min-w-0 flex-1 cursor-pointer flex-col gap-1.5 rounded-md border border-line bg-card p-3 transition hover:border-primary-soft-border has-checked:border-primary-border has-checked:bg-highlight has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent has-disabled:cursor-not-allowed has-disabled:opacity-50 ${className}`}
    >
      <input type={type} className="sr-only" {...props} />
      <span className="flex items-center gap-2">
        <Icon aria-hidden className="size-4 shrink-0 text-fg group-has-checked:text-chip-selected-fg" />
        <span className="flex-1 text-label font-semibold text-fg group-has-checked:text-chip-selected-fg">
          {title}
        </span>
        {type === 'radio' ? (
          <span
            aria-hidden
            className="flex size-3.25 shrink-0 items-center justify-center rounded-full border border-line group-has-checked:border-primary"
          >
            <span className="hidden size-1.75 rounded-full bg-primary group-has-checked:block" />
          </span>
        ) : (
          <span
            aria-hidden
            className="flex size-3.5 shrink-0 items-center justify-center rounded-xs border border-line group-has-checked:border-primary group-has-checked:bg-primary"
          >
            <Check className="hidden size-2.5 text-on-primary group-has-checked:block" />
          </span>
        )}
      </span>
      {description && <span className="text-small text-fg-muted">{description}</span>}
    </label>
  )
}
