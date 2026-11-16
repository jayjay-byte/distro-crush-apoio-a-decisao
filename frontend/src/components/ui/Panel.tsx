import type { ReactNode } from 'react'

type PanelProps = {
  /** Ex.: "01 · Perfil de uso". */
  title?: string
  description?: string
  /** Ações à direita do título. */
  actions?: ReactNode
  /** Fundo e borda de destaque (1º grupo, destaques). */
  highlight?: boolean
  /** Espaço entre os blocos (padrão `gap-4`; os cards de resultado usam `gap-3`). */
  gap?: 'gap-3' | 'gap-4'
  className?: string
  children: ReactNode
}

/** Card de seção das telas (Figma 10:22814 / 149:69): título, descrição e conteúdo. */
export function Panel({ title, description, actions, highlight = false, gap = 'gap-4', className = '', children }: PanelProps) {
  return (
    <section
      className={`flex flex-col ${gap} rounded-lg border p-4 lg:p-5 ${
        highlight ? 'border-primary-soft-border bg-highlight' : 'border-line bg-card'
      } ${className}`}
    >
      {(title || description || actions) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex flex-1 flex-col gap-0.5">
            {title && <h2 className="text-subheading font-semibold text-fg">{title}</h2>}
            {description && <p className="text-label text-fg-muted">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  )
}
