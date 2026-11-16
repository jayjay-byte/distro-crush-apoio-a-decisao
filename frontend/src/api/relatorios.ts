import { apiFetch } from './client'
import type { DashboardOut, SensibilidadeOut, SimulacaoDetalhe, SimulacaoPagina } from './types'

/** GET /dashboard: indicadores das simulações do usuário logado. */
export function getDashboard(): Promise<DashboardOut> {
  return apiFetch<DashboardOut>('/dashboard')
}

/** GET /simulacoes: só as do usuário logado, da mais recente para a mais antiga. */
export function listarSimulacoes(pagina: number, porPagina: number): Promise<SimulacaoPagina> {
  return apiFetch<SimulacaoPagina>(`/simulacoes?pagina=${pagina}&por_pagina=${porPagina}`)
}

/** GET /simulacoes/{id}: respostas + snapshot salvo (404 se for de outro usuário). */
export function getSimulacao(id: number): Promise<SimulacaoDetalhe> {
  return apiFetch<SimulacaoDetalhe>(`/simulacoes/${id}`)
}

/** GET /simulacoes/{id}/sensibilidade: ranking de grupos com ROC e com pesos iguais (recalculados). */
export function getSensibilidade(id: number): Promise<SensibilidadeOut> {
  return apiFetch<SensibilidadeOut>(`/simulacoes/${id}/sensibilidade`)
}
