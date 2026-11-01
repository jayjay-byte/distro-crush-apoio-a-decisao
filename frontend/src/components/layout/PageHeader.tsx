import type { ReactNode } from 'react'

type PageHeaderProps = {
  eyebrow?: string
  title: string
  description?: string
  /** Ações à direita (ex.: "Nova simulação"). */
  actions?: ReactNode
}

/** Cabeçalho das páginas (Figma 13:1851): sobretítulo, título e descrição. */
export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="flex flex-1 flex-col gap-1">
        {eyebrow && <p className="text-small font-semibold text-accent">{eyebrow}</p>}
        <h1 className="text-title font-extrabold text-fg">{title}</h1>
        {description && <p className="text-body text-fg-muted">{description}</p>}
      </div>
      {actions}
    </div>
  )
}
