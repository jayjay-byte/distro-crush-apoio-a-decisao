import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from '../auth/authContext'
import { ThemeToggle } from '../components/layout/ThemeToggle'
import { LoginForm } from '../components/login/LoginForm'
import { LoginHero } from '../components/login/LoginHero'

/** Tela de Login (Figma 10:22110 / 71:22 desktop, 10:22176 / 71:100 mobile). */
export default function Login() {
  const { usuario } = useAuth()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  useEffect(() => {
    document.title = 'Entrar · Distro Crush'
  }, [])

  // Já logado, ou login concluído: vai para a página pedida (padrão /dashboard).
  if (usuario) return <Navigate to={from} replace />

  return (
    <div className="relative flex min-h-dvh flex-col bg-bg lg:flex-row">
      <ThemeToggle className="absolute top-4 right-4 lg:top-6 lg:right-6" />
      <LoginHero />
      <main className="flex flex-1 flex-col items-center justify-center gap-8 p-6 lg:p-16">
        <LoginForm />
        <p className="w-full max-w-login-form text-center text-caption text-fg-subtle">
          Distro Crush © 2026 · Apoio à decisão em Linux
        </p>
      </main>
    </div>
  )
}
