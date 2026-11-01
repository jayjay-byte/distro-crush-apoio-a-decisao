import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  children?: ReactNode
  /** Ex.: botão "Fazer uma simulação". */
  action?: ReactNode
}

/** Estado vazio das telas (sem simulações, sem grupos...): ícone, explicação e ação. */
export function EmptyState({ icon: Icon, title, children, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-line bg-card p-8 text-center">
      <span className="inline-flex size-11 items-center justify-center rounded-full bg-primary-soft text-accent">
        <Icon aria-hidden className="size-5" />
      </span>
      <div className="flex max-w-md flex-col gap-1">
        <p className="text-subheading font-semibold text-fg">{title}</p>
        {children && <p className="text-body text-fg-muted">{children}</p>}
      </div>
      {action}
    </div>
  )
}
