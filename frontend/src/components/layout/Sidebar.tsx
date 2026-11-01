import { ShieldCheck } from 'lucide-react'
import { LogoCard } from '../brand/LogoCard'
import { NavMenu } from './NavMenu'

/** Barra lateral do desktop (Figma 51:334 / 13:1808). */
export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-sidebar shrink-0 flex-col gap-7.5 overflow-y-auto border-r border-line bg-surface px-4 py-6 lg:flex">
      <LogoCard size="sm" />

      <div className="flex flex-col gap-3">
        <p className="text-caption font-semibold text-fg-subtle">ESPAÇO DE ANÁLISE</p>
        <NavMenu variant="sidebar" />
      </div>

      <div className="flex flex-col gap-2 rounded-md bg-highlight p-3">
        <ShieldCheck aria-hidden className="size-4.5 text-accent" />
        <p className="text-label font-semibold text-fg">Decida com confiança</p>
        <p className="text-small text-fg-muted">Alternativas explicadas a partir do seu perfil e hardware.</p>
      </div>

      <p className="mt-auto text-caption text-fg-subtle">Distro Crush · versão 1.0</p>
    </aside>
  )
}
