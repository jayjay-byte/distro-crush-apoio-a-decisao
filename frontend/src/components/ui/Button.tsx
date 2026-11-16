import { LoaderCircle, type LucideIcon } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  icon?: LucideIcon
  loading?: boolean
  fullWidth?: boolean
}

const VARIANTS: Record<Variant, string> = {
  primary: 'border-primary-border bg-primary text-on-primary hover:brightness-110',
  secondary: 'border-line bg-sunken text-accent hover:bg-primary-soft',
}

export function Button({
  variant = 'primary',
  icon: Icon,
  loading = false,
  fullWidth = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  const ShownIcon = loading ? LoaderCircle : Icon
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex h-control items-center justify-center gap-2 rounded-md border px-4 text-body font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50 ${
        fullWidth ? 'w-full' : ''
      } ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {ShownIcon && <ShownIcon aria-hidden className={`size-4 ${loading ? 'animate-spin' : ''}`} />}
      {children}
    </button>
  )
}
