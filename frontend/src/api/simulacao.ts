import { apiFetch } from './client'
import type { DistroOut, OpcoesOut, Respostas, Resultado, SimulacaoDetalhe } from './types'

/** GET /opcoes: valores distintos de init e desktops da ficha (pública). */
export function getOpcoes(): Promise<OpcoesOut> {
  return apiFetch<OpcoesOut>('/opcoes', { auth: false })
}

/** GET /distros/{id}: dados da ficha, usados nas informações técnicas (pública). */
export function getDistro(id: string): Promise<DistroOut> {
  return apiFetch<DistroOut>(`/distros/${encodeURIComponent(id)}`, { auth: false })
}

/** POST /recomendacao: what-if, calcula com pesos ROC sem salvar. */
export function recomendar(respostas: Respostas): Promise<Resultado> {
  return apiFetch<Resultado>('/recomendacao?pesos=roc', {
    method: 'POST',
    body: JSON.stringify(respostas),
  })
}

/** POST /simulacoes: calcula com ROC e salva respostas + snapshot do resultado. */
export function salvarSimulacao(respostas: Respostas): Promise<SimulacaoDetalhe> {
  return apiFetch<SimulacaoDetalhe>('/simulacoes', {
    method: 'POST',
    body: JSON.stringify(respostas),
  })
}
