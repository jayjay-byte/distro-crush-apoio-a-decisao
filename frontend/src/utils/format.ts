// Formatação de números e datas em pt-BR. Só formata valores vindos da API:
// nada de cálculo de IA, rótulo ou agrupamento aqui.

const LOCALE = 'pt-BR'

const decimalFormats = new Map<string, Intl.NumberFormat>()

function decimalFormat(min: number, max: number): Intl.NumberFormat {
  const key = `${min}-${max}`
  let format = decimalFormats.get(key)
  if (!format) {
    format = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: min, maximumFractionDigits: max })
    decimalFormats.set(key, format)
  }
  return format
}

/** IA em % inteiro, arredondamento comum (Resultado, Dashboard, Relatórios): 0.9185 → "92%". */
export function formatPercent(ia: number): string {
  return `${Math.round(ia * 100)}%`
}

/** IA exato com 1 casa decimal (Detalhamento): 0.97222 → "97,2%". */
export function formatIaExata(ia: number): string {
  return `${decimalFormat(1, 1).format(ia * 100)}%`
}

/** Número com casas fixas: (0.4083, 3) → "0,408". */
export function formatDecimal(value: number, casas: number): string {
  return decimalFormat(casas, casas).format(value)
}

/** Nota de 0 a 1 sem zeros à direita: 1 → "1", 0.5 → "0,5", 0.75 → "0,75". */
export function formatNota(nota: number): string {
  return decimalFormat(0, 2).format(nota)
}

/** Quantidade em GB sem zeros à direita: 0.5 → "0,5", 1024 → "1.024". */
export function formatGb(value: number): string {
  return decimalFormat(0, 2).format(value)
}

/** Percentual com 1 casa (fatia da rosca, calculada no front): (1, 6) → "16,7%". */
export function formatFracao(parte: number, total: number): string {
  return `${decimalFormat(1, 1).format(total > 0 ? (parte / total) * 100 : 0)}%`
}

function toDate(iso: string | Date): Date {
  return typeof iso === 'string' ? new Date(iso) : iso
}

/** Data ISO 8601 → "29/06/2026" (fuso do navegador). */
export function formatData(iso: string | Date): string {
  return toDate(iso).toLocaleDateString(LOCALE)
}

/** Data ISO 8601 → "29/06" (eixo do gráfico de linha). */
export function formatDiaMes(iso: string | Date): string {
  return toDate(iso).toLocaleDateString(LOCALE, { day: '2-digit', month: '2-digit' })
}

/** Data ISO 8601 → "29/06/2026, às 14:32" (fuso do navegador). */
export function formatDataHora(iso: string | Date): string {
  const date = toDate(iso)
  const dia = date.toLocaleDateString(LOCALE)
  const hora = date.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' })
  return `${dia}, às ${hora}`
}

/** Texto digitado → número, com vírgula ou ponto decimal ("0,5", "0.5"; sem separador de milhar). `null` se inválido. */
export function parseDecimal(text: string): number | null {
  const normalized = text.trim().replace(',', '.')
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) return null
  return Number(normalized)
}
