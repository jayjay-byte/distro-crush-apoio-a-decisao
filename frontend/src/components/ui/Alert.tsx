import { CircleAlert, Info, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type Variant = 'info' | 'erro'

const VARIANTS: Record<Variant, { box: string; icon: string; Icon: LucideIcon; role: 'status' | 'alert' }> = {
  info: { box: 'border-primary-soft-border bg-highlight text-fg', icon: 'text-accent', Icon: Info, role: 'status' },
  erro: { box: 'border-danger-border bg-danger-soft text-danger', icon: 'text-danger', Icon: CircleAlert, role: 'alert' },
}

type AlertProps = {
  variant?: Variant
  /** Troca o ícone padrão da variante. */
  icon?: LucideIcon
  title?: string
  /** Botão à direita (ex.: "Tentar novamente"). */
  action?: ReactNode
  className?: string
  children?: ReactNode
}

/** Faixa de aviso (Figma 10:22811): ícone, texto e ação opcional. */
export function Alert({ variant = 'info', icon, title, action, className = '', children }: AlertProps) {
  const { box, icon: iconColor, Icon: DefaultIcon, role } = VARIANTS[variant]
  const Icon = icon ?? DefaultIcon
  return (
    <div role={role} className={`flex items-start gap-2.5 rounded-md border p-3.5 text-label ${box} ${className}`}>
      <Icon aria-hidden className={`mt-px size-4.5 shrink-0 ${iconColor}`} />
      <div className="flex flex-1 flex-col gap-1">
        {title && <p className="font-semibold">{title}</p>}
        {children}
      </div>
      {action}
    </div>
  )
}
