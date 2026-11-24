import { apiFetch } from './client'
import type { CriterioOut, DistroOut, OpcoesOut, Respostas, Resultado, SimulacaoDetalhe } from './types'

/** GET /opcoes: valores distintos de init e desktops da ficha (pública). */
export function getOpcoes(): Promise<OpcoesOut> {
  return apiFetch<OpcoesOut>('/opcoes', { auth: false })
}

/** GET /criterios: critérios com peso ROC e peso sugerido de 0 a 10 (pública). */
export function getCriterios(): Promise<CriterioOut[]> {
  return apiFetch<CriterioOut[]>('/criterios', { auth: false })
}

/** GET /distros/{id}: dados da ficha, usados nas informações técnicas (pública). */
export function getDistro(id: string): Promise<DistroOut> {
  return apiFetch<DistroOut>(`/distros/${encodeURIComponent(id)}`, { auth: false })
}

/** POST /recomendacao: what-if, calcula sem salvar (com `respostas.pesos` ou, sem eles, ROC). */
export function recomendar(respostas: Respostas): Promise<Resultado> {
  return apiFetch<Resultado>('/recomendacao?pesos=roc', {
    method: 'POST',
    body: JSON.stringify(respostas),
  })
}

/** POST /simulacoes: calcula (pesos do usuário ou ROC) e salva respostas, pesos e snapshot. */
export function salvarSimulacao(respostas: Respostas): Promise<SimulacaoDetalhe> {
  return apiFetch<SimulacaoDetalhe>('/simulacoes', {
    method: 'POST',
    body: JSON.stringify(respostas),
  })
}
