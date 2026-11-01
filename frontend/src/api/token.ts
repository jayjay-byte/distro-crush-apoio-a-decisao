import type { TokenOut, Usuario } from './types'

const STORAGE_KEY = 'distro-crush:sessao'

export type Session = {
  token: string
  expiraEm: string
  usuario: Usuario
}

export function saveSession(data: TokenOut): Session {
  const session: Session = {
    token: data.access_token,
    expiraEm: data.expira_em,
    usuario: data.usuario,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  return session
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY)
}

/** Sessão salva; inválida ou expirada conta como ausente (e é apagada). */
export function getSession(): Session | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const session = JSON.parse(raw) as Session
    if (!session.token || Date.parse(session.expiraEm) <= Date.now()) {
      clearSession()
      return null
    }
    return session
  } catch {
    clearSession()
    return null
  }
}
