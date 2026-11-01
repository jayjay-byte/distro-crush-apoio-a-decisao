import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type StatCardProps = {
  title: string
  icon: LucideIcon
  /** Valor em destaque (ex.: "6", "92%", "Linux Mint"). */
  value: string
  children?: ReactNode
}

/** Card de indicador do Dashboard (Figma 51:425): nome, ícone, valor e apoio. */
export function StatCard({ title, icon: Icon, value, children }: StatCardProps) {
  return (
    <section className="flex min-w-0 flex-col gap-4 rounded-lg border border-line bg-card p-4.5">
      <div className="flex items-start gap-2">
        <h2 className="flex-1 text-label font-semibold text-fg-muted">{title}</h2>
        <Icon aria-hidden className="size-4.25 shrink-0 text-accent" />
      </div>
      <p className="text-metric font-extrabold break-words text-fg">{value}</p>
      {children}
    </section>
  )
}
