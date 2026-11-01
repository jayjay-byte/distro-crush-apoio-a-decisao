import { useId, type InputHTMLAttributes, type ReactNode } from 'react'

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  /** Ícone ou botão no fim do campo (ex.: mostrar senha). */
  trailing?: ReactNode
}

export function TextField({ label, trailing, id, className = '', ...props }: TextFieldProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <div className={`flex w-full flex-col gap-1.5 ${className}`}>
      <label htmlFor={inputId} className="text-label font-semibold text-fg-muted">
        {label}
      </label>
      <div className="flex h-control items-center gap-2 rounded-md border border-line bg-card px-3 text-fg-muted transition focus-within:border-accent">
        <input
          id={inputId}
          className="min-w-0 flex-1 bg-transparent text-body text-fg outline-none placeholder:text-fg-subtle"
          {...props}
        />
        {trailing}
      </div>
    </div>
  )
}
