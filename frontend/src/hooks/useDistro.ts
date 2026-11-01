import { getDistro } from '../api/simulacao'
import type { DistroOut } from '../api/types'
import { useRequest, type RequestState } from './useRequest'

// A ficha não muda durante a sessão: cada distro é buscada uma vez só.
const cache = new Map<string, Promise<DistroOut>>()

function loadDistro(id: string): Promise<DistroOut> {
  let request = cache.get(id)
  if (!request) {
    request = getDistro(id)
    cache.set(id, request)
    // Falhou: tira do cache para o "Tentar novamente" buscar de novo.
    request.catch(() => cache.delete(id))
  }
  return request
}

/** GET /distros/{id}, com cache em memória (informações técnicas do detalhamento). */
export function useDistro(id: string): RequestState<DistroOut> {
  return useRequest(id, () => loadDistro(id), 'Não foi possível carregar as informações técnicas.')
}
