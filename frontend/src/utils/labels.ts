// Rótulos da tela para os valores da API ("Correspondência entre tela e ficha" no CLAUDE.md).
// Reaproveitados no formulário, no detalhamento e, na Fase 4c, em Relatórios.

import type { Ajuda, Ambiente, Arquitetura, Atualizacoes, CriterioId, Nivel, Tarefa } from '../api/types'

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
