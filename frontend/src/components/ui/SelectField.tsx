import { ChevronDown } from 'lucide-react'
import { useId, type SelectHTMLAttributes } from 'react'

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  options: { value: string; label: string }[]
}

/** Campo de seleção (Figma 10:22942): rótulo + `<select>` nativo com chevron. */
export function SelectField({ label, options, id, className = '', ...props }: SelectFieldProps) {
  const autoId = useId()
  const selectId = id ?? autoId
  return (
    <div className={`flex min-w-0 flex-1 flex-col gap-1.5 ${className}`}>
      <label htmlFor={selectId} className="text-label font-semibold text-fg-muted">
        {label}
      </label>
      <div className="relative">
        <select
          id={selectId}
          className="h-control w-full cursor-pointer appearance-none rounded-md border border-line bg-sunken pr-9 pl-3 text-body text-fg transition focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-fg-muted"
        />
      </div>
    </div>
  )
}
