import { clearSession, getSession } from './token'

// O Vite encaminha /api para http://localhost:8000 (vite.config.ts).
const BASE_URL = '/api'

export const NETWORK_ERROR_MESSAGE = 'Não foi possível conectar ao servidor.'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

let unauthorizedHandler: (() => void) | null = null

/** Chamado depois de limpar o token quando uma rota protegida responde 401. */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler
}

type ApiRequestInit = RequestInit & {
  /** Envia o token e trata 401 como sessão encerrada. Padrão: true. */
  auth?: boolean
}

function detailOf(body: unknown, fallback: string): string {
  if (body && typeof body === 'object' && 'detail' in body) {
    const { detail } = body as { detail: unknown }
    if (typeof detail === 'string') return detail
  }
  return fallback
}

export async function apiFetch<T>(path: string, { auth = true, ...init }: ApiRequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  if (auth) {
    const session = getSession()
    if (session) headers.set('Authorization', `Bearer ${session.token}`)
  }

  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, { ...init, headers })
  } catch {
    throw new ApiError(0, NETWORK_ERROR_MESSAGE)
  }

  const body: unknown = response.status === 204 ? null : await response.json().catch(() => null)

  if (!response.ok) {
    // Sem resposta JSON do back-end (ex.: proxy sem servidor) = falha de conexão.
    if (body === null && response.status >= 500) throw new ApiError(response.status, NETWORK_ERROR_MESSAGE)
    if (response.status === 401 && auth) {
      clearSession()
      unauthorizedHandler?.()
    }
    throw new ApiError(response.status, detailOf(body, `Erro ${response.status}`))
  }

  return body as T
}
