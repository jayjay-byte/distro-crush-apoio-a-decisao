import type { ReactNode } from 'react'

/** Caixa do tooltip dos gráficos (Recharts `content`), com os tokens do tema. */
export function ChartTooltip({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex max-w-60 flex-col gap-0.5 rounded-md border border-line bg-card px-3 py-2 text-small text-fg shadow-sm">
      <p className="font-semibold">{title}</p>
      {children && <div className="text-fg-muted">{children}</div>}
    </div>
  )
}

