import { useEffect } from 'react'
import { Outlet } from 'react-router'
import { NavMenu } from './NavMenu'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { usePageTitle } from './usePageTitle'

/** Layout das telas autenticadas: barra lateral no desktop, menu superior no mobile. */
export function AppLayout() {
  const title = usePageTitle()

  useEffect(() => {
    document.title = title ? `${title} · Distro Crush` : 'Distro Crush'
  }, [title])

  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-10">
          <Topbar />
          <div className="border-b border-line bg-surface px-3 py-2 lg:hidden">
            <NavMenu variant="mobile" />
          </div>
        </div>
        <main className="flex flex-1 flex-col gap-5 p-4 lg:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
