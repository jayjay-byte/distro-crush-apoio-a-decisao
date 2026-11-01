import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from './authContext'

/** Rotas protegidas: sem sessão, vai para /login e volta à página pedida depois. */
export function RequireAuth() {
  const { usuario } = useAuth()
  const location = useLocation()

  if (!usuario) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}
