import { createContext, useContext } from 'react'
import type { Usuario } from '../api/types'

export type AuthContextValue = {
  usuario: Usuario | null
  login: (login: string, senha: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return value
}
