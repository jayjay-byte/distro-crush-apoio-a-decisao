import { LogOut, type LucideIcon } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../../auth/authContext'
import { NAV_ITEMS, isNavItemActive } from './navItems'

type Variant = 'sidebar' | 'mobile'

// sidebar: itens em linha (13:1819) · mobile: ícone sobre o texto (13:2111)
const ITEM: Record<Variant, string> = {
  sidebar: 'h-nav-item w-full gap-2.5 p-3 text-body',
  mobile: 'h-nav-item-mobile flex-1 flex-col justify-center gap-1 p-1.5 text-caption',
}
const BASE =
  'flex min-w-0 items-center rounded-md transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
const ACTIVE = 'bg-primary-soft font-semibold text-on-primary-soft'
const IDLE = 'text-fg-muted hover:bg-primary-soft hover:text-on-primary-soft'

function ItemContent({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <>
      <Icon aria-hidden className="size-4.5 shrink-0" />
      <span className="truncate">{label}</span>
    </>
  )
}

/** Dashboard, Simulação, Relatórios e Sair; usado na barra lateral e no menu mobile. */
export function NavMenu({ variant }: { variant: Variant }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <nav aria-label="Navegação principal" className={variant === 'sidebar' ? 'flex flex-col gap-1.5' : 'flex gap-1'}>
      {NAV_ITEMS.map((item) => {
        const active = isNavItemActive(item, pathname)
        return (
          <Link
            key={item.to}
            to={item.to}
            aria-current={active ? 'page' : undefined}
            className={`${BASE} ${ITEM[variant]} ${active ? ACTIVE : IDLE}`}
          >
            <ItemContent icon={item.icon} label={item.label} />
          </Link>
        )
      })}
      <button type="button" onClick={handleLogout} className={`${BASE} ${ITEM[variant]} ${IDLE}`}>
        <ItemContent icon={LogOut} label="Sair" />
      </button>
    </nav>
  )
}
