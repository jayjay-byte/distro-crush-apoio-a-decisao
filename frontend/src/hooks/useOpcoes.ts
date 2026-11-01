import { getOpcoes } from '../api/simulacao'
import type { OpcoesOut } from '../api/types'
import { useRequest, type RequestState } from './useRequest'

/** GET /opcoes: valores de init e ambiente gráfico da ficha (nunca fixos no código). */
export function useOpcoes(): RequestState<OpcoesOut> {
  return useRequest('opcoes', getOpcoes, 'Não foi possível carregar as opções de init e ambiente gráfico.')
}
