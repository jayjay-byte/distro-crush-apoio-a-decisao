import { Navigate, createBrowserRouter } from 'react-router'
import { RequireAuth } from './auth/RequireAuth'
import { AppLayout } from './components/layout/AppLayout'
import type { RouteHandle } from './components/layout/usePageTitle'
import Dashboard from './pages/Dashboard'
import Detalhamento from './pages/Detalhamento'
import Login from './pages/Login'
import Relatorios from './pages/Relatorios'
import Resultado from './pages/Resultado'
import Simulacao from './pages/Simulacao'

const title = (t: string): RouteHandle => ({ title: t })

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/dashboard', element: <Dashboard />, handle: title('Meu dashboard') },
          { path: '/simulacao', element: <Simulacao />, handle: title('Simulação') },
          { path: '/resultado', element: <Resultado />, handle: title('Resultado') },
          { path: '/distro/:id', element: <Detalhamento />, handle: title('Detalhamento') },
          { path: '/relatorios', element: <Relatorios />, handle: title('Relatórios') },
        ],
      },
    ],
  },
  // "/" e rotas desconhecidas
  { path: '*', element: <Navigate to="/dashboard" replace /> },
])
