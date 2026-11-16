// Estado do formulário de simulação e conversão para o formato da API,
// conforme "Correspondência entre tela e ficha" (CLAUDE.md).

import type { Ajuda, Ambiente, Arquitetura, Atualizacoes, Nivel, Respostas, Tarefa } from '../../api/types'
import { parseDecimal } from '../../utils/format'

export type FormState = {
  /** "Uso geral" ou "Tarefa específica"; a tarefa só vale com `tarefa_especifica`. */
  proposito: 'geral' | 'tarefa_especifica'
  tarefa: Tarefa | null
  ambiente: Ambiente
  /** Vazio = "Sem preferência". */
  ajuda: Ajuda[]
  nivel: Nivel
  /** Texto digitado, em GB (aceita vírgula). */
  ram: string
  disco: string
  arquitetura: Arquitetura
  /** `null` = "Sem preferência". */
  atualizacoes: Atualizacoes | null
  /** '' = "Sem preferência". */
  desktop: string
  init: string
}

export const INITIAL_FORM: FormState = {
  proposito: 'geral',
  tarefa: null,
  ambiente: 'desktop',
  ajuda: [],
  nivel: 'iniciante',
  ram: '8',
  disco: '128',
  arquitetura: 'x86_64',
  atualizacoes: null,
  desktop: '',
  init: '',
}

/** Número de perguntas do formulário (seção 3 da especificação). */
export const TOTAL_PERGUNTAS = 10

export type FormErrors = Partial<Record<'tarefa' | 'ram' | 'disco', string>>

/** Ids dos campos que podem ter erro, para focar o primeiro inválido. */
export const CAMPO_ID: Record<keyof FormErrors, string> = {
  tarefa: 'simulacao-tarefa-jogos',
  ram: 'simulacao-ram',
  disco: 'simulacao-disco',
}

/**
 * Validação de RAM e armazenamento: maior que zero e até um teto. Valores
 * abaixo da faixa do slider continuam válidos (hardware antigo).
 */
const REGRAS_GB = {
  ram: {
    maximo: 1024,
    vazio: 'Informe a memória RAM em GB.',
    invalido: 'Digite a memória RAM só com números (ex.: 8 ou 0,5).',
    zero: 'A memória RAM deve ser maior que zero.',
    teto: 'A memória RAM deve ser de no máximo 1.024 GB.',
  },
  disco: {
    maximo: 100000,
    vazio: 'Informe o armazenamento em GB.',
    invalido: 'Digite o armazenamento só com números (ex.: 128).',
    zero: 'O armazenamento deve ser maior que zero.',
    teto: 'O armazenamento deve ser de no máximo 100.000 GB.',
  },
}

function validarGb(texto: string, campo: keyof typeof REGRAS_GB): string | undefined {
  const regras = REGRAS_GB[campo]
  if (!texto.trim()) return regras.vazio
  const valor = parseDecimal(texto)
  if (valor === null) return regras.invalido
  if (valor <= 0) return regras.zero
  if (valor > regras.maximo) return regras.teto
  return undefined
}

export function validate(form: FormState): FormErrors {
  const errors: FormErrors = {}
  if (form.proposito === 'tarefa_especifica' && !form.tarefa) errors.tarefa = 'Escolha a tarefa específica.'
  const ram = validarGb(form.ram, 'ram')
  if (ram) errors.ram = ram
  const disco = validarGb(form.disco, 'disco')
  if (disco) errors.disco = disco
  return errors
}

/** Respostas no formato da API. Só chame com o formulário válido. */
export function toRespostas(form: FormState): Respostas {
  return {
    tarefa: form.proposito === 'tarefa_especifica' ? form.tarefa : null,
    ambiente: form.ambiente,
    ram_gb: parseDecimal(form.ram) ?? 0,
    disco_gb: parseDecimal(form.disco) ?? 0,
    arquitetura: form.arquitetura,
    nivel: form.nivel,
    ajuda: form.ajuda.length > 0 ? form.ajuda : null,
    atualizacoes: form.atualizacoes,
    init: form.init || null,
    desktop: form.desktop || null,
  }
}

/** Chave estável das respostas, para saber se mudaram desde a última análise. */
export function respostasKey(respostas: Respostas): string {
  return JSON.stringify(respostas)
}

/**
 * Marca/desmarca Fórum ou Pago. "Sem preferência" é a lista vazia: marcar uma
 * opção a desmarca, e desmarcar todas volta a ela.
 */
export function toggleAjuda(atual: Ajuda[], valor: Ajuda): Ajuda[] {
  const marcadas = atual.includes(valor) ? atual.filter((a) => a !== valor) : [...atual, valor]
  // Mantém a ordem da tela (fórum, pago).
  return (['forum', 'pago'] as const).filter((a) => marcadas.includes(a))
}
