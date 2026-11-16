// Rótulos da tela para os valores da API ("Correspondência entre tela e ficha" no CLAUDE.md).
// Reaproveitados no formulário, no detalhamento e em Relatórios.

import type { Ajuda, Ambiente, Arquitetura, Atualizacoes, CriterioId, Nivel, Respostas, Tarefa } from '../api/types'
import { formatGb } from './format'

export const SEM_PREFERENCIA = 'Sem preferência'

export const CRITERIO_LABEL: Record<CriterioId, string> = {
  proposito: 'Propósito',
  usabilidade: 'Usabilidade',
  suporte: 'Suporte',
  estabilidade: 'Estabilidade',
  init: 'Init',
  ambiente_grafico: 'Ambiente gráfico',
}

/** `null` = Uso geral. */
export const TAREFA_LABEL: Record<Tarefa, string> = {
  jogos: 'Jogos',
  seguranca: 'Segurança',
  hardware_antigo: 'Hardware antigo',
}

export const USO_GERAL = 'Uso geral'

export const AMBIENTE_LABEL: Record<Ambiente, string> = {
  desktop: 'Desktop',
  servidor: 'Servidor',
  nuvem: 'Nuvem',
}

export const ARQUITETURA_LABEL: Record<Arquitetura, string> = {
  x86_64: '64 bits (x86_64)',
  i686: '32 bits (i686)',
  arm: 'ARM',
}

export const NIVEL_LABEL: Record<Nivel, string> = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
}

export const AJUDA_LABEL: Record<Ajuda, string> = {
  forum: 'Fórum oficial',
  pago: 'Suporte pago',
}

/** Escolha do usuário (`null` = Sem preferência). */
export const ATUALIZACOES_LABEL: Record<Atualizacoes, string> = {
  padrao: 'Versão fixa',
  rolling: 'Rolling',
}

/** `modelo_lancamento` da ficha, em minúsculas para o meio de frase ("Modelo: versão fixa"). */
const MODELO_LABEL: Record<string, string> = {
  padrao: 'versão fixa',
  rolling: 'rolling',
}

export function modeloLabel(valor: string): string {
  return MODELO_LABEL[valor.trim().toLowerCase()] ?? valor
}

/** "Fórum oficial", "Fórum oficial, Suporte pago" ou "Sem preferência". */
export function ajudaLabel(ajuda: Ajuda[] | null): string {
  return ajuda && ajuda.length > 0 ? ajuda.map((a) => AJUDA_LABEL[a]).join(', ') : SEM_PREFERENCIA
}

/** As 10 respostas com os rótulos da tela, na ordem do Figma de Relatórios (10:23441). */
export function respostasLabels(r: Respostas): { label: string; valor: string }[] {
  return [
    { label: 'Propósito', valor: r.tarefa ? TAREFA_LABEL[r.tarefa] : USO_GERAL },
    { label: 'Ambiente', valor: AMBIENTE_LABEL[r.ambiente] },
    { label: 'Tipo de ajuda', valor: ajudaLabel(r.ajuda) },
    { label: 'Usabilidade', valor: NIVEL_LABEL[r.nivel] },
    { label: 'Memória RAM', valor: `${formatGb(r.ram_gb)} GB` },
    { label: 'Armazenamento', valor: `${formatGb(r.disco_gb)} GB disponíveis` },
    { label: 'Arquitetura', valor: ARQUITETURA_LABEL[r.arquitetura] },
    { label: 'Estabilidade', valor: r.atualizacoes ? ATUALIZACOES_LABEL[r.atualizacoes] : SEM_PREFERENCIA },
    { label: 'Ambiente gráfico', valor: r.desktop ?? SEM_PREFERENCIA },
    { label: 'Sistema init', valor: r.init ?? SEM_PREFERENCIA },
  ]
}
