// Estado do formulário de simulação e conversão para o formato da API,
// conforme "Correspondência entre tela e ficha" (CLAUDE.md).

import type {
  Ajuda,
  Ambiente,
  Arquitetura,
  Atualizacoes,
  CriterioId,
  Nivel,
  PesosUsuario,
  Respostas,
  Tarefa,
} from '../../api/types'
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
  /**
   * Notas digitadas (0 a 10) que o usuário alterou. Critério ausente = peso
   * sugerido de GET /criterios. `{}` = "Restaurar pesos sugeridos (ROC)".
   */
  pesos: Partial<Record<CriterioId, string>>
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
  pesos: {},
}

/** Pesos sugeridos (0 a 10) por critério, vindos de GET /criterios. `null` enquanto não carregam. */
export type Sugeridos = PesosUsuario | null

/** Ordem dos critérios ponderados (a mesma da API). */
export const CRITERIOS: CriterioId[] = ['proposito', 'usabilidade', 'suporte', 'estabilidade', 'init', 'ambiente_grafico']

/** Texto mostrado no campo de peso: a nota alterada ou a sugerida. */
export function pesoTexto(form: FormState, criterio: CriterioId, sugeridos: Sugeridos): string {
  return form.pesos[criterio] ?? (sugeridos ? String(sugeridos[criterio]) : '')
}

/** Critérios que entram no IA: propósito e usabilidade sempre; os demais, se não forem "Sem preferência". */
export function criteriosRespondidos(form: FormState): Set<CriterioId> {
  const respondidos = new Set<CriterioId>(['proposito', 'usabilidade'])
  if (form.ajuda.length > 0) respondidos.add('suporte')
  if (form.atualizacoes !== null) respondidos.add('estabilidade')
  if (form.init) respondidos.add('init')
  if (form.desktop) respondidos.add('ambiente_grafico')
  return respondidos
}

/**
 * As 6 notas, se alguma for diferente da sugerida; `null` se todas forem iguais
 * às sugeridas (ou se os sugeridos não carregaram): o back-end usa o ROC exato.
 */
export function toPesos(form: FormState, sugeridos: Sugeridos): PesosUsuario | null {
  if (!sugeridos) return null
  const pesos = { ...sugeridos }
  for (const criterio of CRITERIOS) {
    const texto = form.pesos[criterio]
    if (texto !== undefined && /^\d+$/.test(texto)) pesos[criterio] = Number(texto)
  }
  return CRITERIOS.some((c) => pesos[c] !== sugeridos[c]) ? pesos : null
}

/** Número de perguntas do formulário (seção 3 da especificação). */
export const TOTAL_PERGUNTAS = 10

export type FormErrors = Partial<Record<'tarefa' | 'ram' | 'disco' | 'pesos', string>> & {
  /** Nota vazia num campo de peso (enquanto digita; ao sair, volta ao último valor válido). */
  peso?: Partial<Record<CriterioId, string>>
}

/** Erros das perguntas (os de peso não contam como resposta). */
export const ERROS_PERGUNTAS = ['tarefa', 'ram', 'disco'] as const

export const MSG_PESOS_ZERADOS = 'Defina ao menos um peso maior que zero'
const MSG_PESO_VAZIO = 'Informe uma nota de 0 a 10.'

/** Ids dos campos que podem ter erro, para focar o primeiro inválido. */
export const CAMPO_ID: Record<'tarefa' | 'ram' | 'disco' | 'pesos', string> = {
  tarefa: 'simulacao-tarefa-jogos',
  ram: 'simulacao-ram',
  disco: 'simulacao-disco',
  pesos: 'simulacao-peso-proposito',
}

export function pesoCampoId(criterio: CriterioId): string {
  return `simulacao-peso-${criterio}`
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

/**
 * Validação do formulário. Nos pesos é só validação (não há cálculo): qualquer
 * campo de peso vazio bloqueia Atualizar e Salvar, e a soma zero das notas dos
 * critérios respondidos também, quando as notas forem enviadas (com as
 * sugeridas, o back-end usa o ROC).
 */
export function validate(form: FormState, sugeridos: Sugeridos = null): FormErrors {
  const errors: FormErrors = {}
  const respondidos = criteriosRespondidos(form)
  const vazios = CRITERIOS.filter((c) => form.pesos[c] === '')
  if (vazios.length > 0) errors.peso = Object.fromEntries(vazios.map((c) => [c, MSG_PESO_VAZIO]))
  const pesos = toPesos(form, sugeridos)
  if (vazios.length === 0 && pesos && [...respondidos].every((c) => pesos[c] === 0)) {
    errors.pesos = MSG_PESOS_ZERADOS
  }
  if (form.proposito === 'tarefa_especifica' && !form.tarefa) errors.tarefa = 'Escolha a tarefa específica.'
  const ram = validarGb(form.ram, 'ram')
  if (ram) errors.ram = ram
  const disco = validarGb(form.disco, 'disco')
  if (disco) errors.disco = disco
  return errors
}

/** Respostas no formato da API, com `pesos` só se alguma nota diferir da sugerida. Só chame com o formulário válido. */
export function toRespostas(form: FormState, sugeridos: Sugeridos = null): Respostas {
  const pesos = toPesos(form, sugeridos)
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
    ...(pesos ? { pesos } : {}),
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
