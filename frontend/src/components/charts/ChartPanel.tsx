import type { ReactNode } from 'react'

type ChartPanelProps = {
  title: string
  description?: string
  /** Legenda e destaque à direita (linha acima do gráfico). */
  legend?: ReactNode
  className?: string
  children: ReactNode
}

/** Painel de gráfico (Figma 51:448): título 16px, descrição, legenda e o gráfico. */
export function ChartPanel({ title, description, legend, className = '', children }: ChartPanelProps) {
  return (
    <section className={`flex min-w-0 flex-col gap-4 rounded-lg border border-line bg-card p-4 lg:p-5 ${className}`}>
      <div className="flex flex-col gap-0.75">
        <h2 className="text-heading font-semibold text-fg">{title}</h2>
        {description && <p className="text-label text-fg-muted">{description}</p>}
      </div>
      {legend}
      {children}
    </section>
  )
}

/** Item de legenda: marcador quadrado (barras/fatias) ou traço (linha) + texto. */
export function LegendItem({ color, shape = 'square', children }: { color: string; shape?: 'square' | 'line'; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-small text-fg-muted">
      <span
        aria-hidden
        className={shape === 'line' ? 'h-0.75 w-4 shrink-0' : 'size-2.25 shrink-0'}
        style={{ backgroundColor: color }}
      />
      {children}
    </span>
  )
}
