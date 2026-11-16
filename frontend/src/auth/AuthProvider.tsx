import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { login as loginRequest } from '../api/auth'
import { setUnauthorizedHandler } from '../api/client'
import { clearSession, getSession, saveSession, type Session } from '../api/token'
import { AuthContext } from './authContext'

/**
 * Guarda a sessão (token JWT no localStorage). Sem sessão, RequireAuth
 * redireciona para /login; isso vale para "Sair", para um 401 da API e
 * para o fim da validade do token.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(getSession)

  const logout = useCallback(() => {
    clearSession()
    setSession(null)
  }, [])

  const login = useCallback(async (login: string, senha: string) => {
    setSession(saveSession(await loginRequest({ login, senha })))
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(() => setSession(null))
    return () => setUnauthorizedHandler(null)
  }, [])

  // Encerra a sessão quando o token expira (8 h) com a página aberta.
  useEffect(() => {
    if (!session) return
    const timer = window.setTimeout(logout, Date.parse(session.expiraEm) - Date.now())
    return () => window.clearTimeout(timer)
  }, [session, logout])

  const value = useMemo(
    () => ({ usuario: session?.usuario ?? null, login, logout }),
    [session, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
