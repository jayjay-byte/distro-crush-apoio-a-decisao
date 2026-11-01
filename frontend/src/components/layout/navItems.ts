import { ChartNoAxesCombined, LayoutDashboard, SlidersHorizontal, type LucideIcon } from 'lucide-react'

export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  /** Prefixos de rota que deixam o item ativo. */
  activeFor: string[]
}

/** Lista única dos menus (barra lateral e menu mobile). "Sair" é uma ação à parte. */
export const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, activeFor: ['/dashboard'] },
  { to: '/simulacao', label: 'Simulação', icon: SlidersHorizontal, activeFor: ['/simulacao', '/resultado', '/distro'] },
  { to: '/relatorios', label: 'Relatórios', icon: ChartNoAxesCombined, activeFor: ['/relatorios'] },
]

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  return item.activeFor.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}
