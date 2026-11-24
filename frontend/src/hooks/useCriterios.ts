import { getCriterios } from '../api/simulacao'
import type { CriterioOut } from '../api/types'
import { useRequest, type RequestState } from './useRequest'

/** GET /criterios: pesos sugeridos de 0 a 10 (nunca fixos no código). */
export function useCriterios(): RequestState<CriterioOut[]> {
  return useRequest('criterios', getCriterios, 'Não foi possível carregar os pesos sugeridos.')
}
