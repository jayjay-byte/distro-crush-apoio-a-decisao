import { ChevronRight } from 'lucide-react'
import { LogoIcon } from '../brand/Logo'
import { ThemeToggle } from './ThemeToggle'
import { UserBadge } from './UserBadge'
import { usePageTitle } from './usePageTitle'

/**
 * Barra superior. Desktop (51:369 / 13:1838): trilha "Área de análise › página".
 * Mobile (13:2098): ícone do logo no lugar da trilha.
 */
export function Topbar() {
  const title = usePageTitle()
  return (
    <header className="flex h-topbar-mobile items-center justify-between border-b border-line bg-surface px-4 lg:h-topbar lg:px-7">
      <LogoIcon className="size-logo-sm lg:hidden" />
      <nav aria-label="Localização" className="hidden items-center gap-2 text-label lg:flex">
        <span className="text-fg-muted">Área de análise</span>
        <ChevronRight aria-hidden className="size-3 text-fg-muted" />
        <span aria-current="page" className="font-semibold text-fg">
          {title}
        </span>
      </nav>

      <div className="flex items-center gap-2.5">
        <ThemeToggle />
        <UserBadge />
      </div>
    </header>
  )
}
