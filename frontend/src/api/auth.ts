import { apiFetch } from './client'
import type { LoginIn, TokenOut } from './types'

/** POST /auth/login. Credenciais inválidas lançam ApiError 401 sem redirecionar. */
export function login(credentials: LoginIn): Promise<TokenOut> {
  return apiFetch<TokenOut>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
    auth: false,
  })
}
