import { Check } from 'lucide-react'
import type { InputHTMLAttributes } from 'react'

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string
}

export function Checkbox({ label, className = '', ...props }: CheckboxProps) {
  return (
    <label
      className={`inline-flex items-center gap-2 text-label text-fg has-disabled:cursor-not-allowed has-disabled:opacity-50 ${className}`}
    >
      <span className="relative inline-flex size-4 shrink-0">
        <input
          type="checkbox"
          className="peer size-4 appearance-none rounded-xs border border-line bg-card checked:border-primary checked:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          {...props}
        />
        <Check
          aria-hidden
          className="pointer-events-none absolute inset-0.5 hidden size-3 text-on-primary peer-checked:block"
        />
      </span>
      {label}
    </label>
  )
}
