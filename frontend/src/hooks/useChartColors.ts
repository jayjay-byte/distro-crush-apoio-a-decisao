import { useSyncExternalStore } from 'react'

/** Variáveis de `index.css` usadas pelos gráficos (o Recharts precisa de cores reais no SVG). */
const VARS = {
  serie1: '--c-chart-1',
  serie2: '--c-chart-2',
  serie3: '--c-chart-3',
  serie4: '--c-chart-4',
  bar: '--c-bar',
  grid: '--c-chart-grid',
  axis: '--c-chart-axis',
  track: '--c-chart-track',
  card: '--c-card',
  fg: '--c-fg',
  fgMuted: '--c-fg-muted',
  label: '--c-on-primary-soft',
} as const

export type ChartColors = Record<keyof typeof VARS, string>

let cache: { className: string; colors: ChartColors } | null = null

function read(): ChartColors {
  const root = document.documentElement
  // O tema muda só a classe do <html>: enquanto ela não mudar, devolve o mesmo objeto.
  if (cache && cache.className === root.className) return cache.colors
  const style = getComputedStyle(root)
  const colors = Object.fromEntries(
    Object.entries(VARS).map(([key, name]) => [key, style.getPropertyValue(name).trim()]),
  ) as ChartColors
  cache = { className: root.className, colors }
  return colors
}

function subscribe(onChange: () => void): () => void {
  // A classe .dark é aplicada num efeito do ThemeProvider, depois dos efeitos dos filhos:
  // observar o <html> garante a leitura com o tema já trocado.
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  return () => observer.disconnect()
}

/** Cores dos gráficos no tema atual, lidas dos tokens (sem valores soltos nos componentes). */
export function useChartColors(): ChartColors {
  return useSyncExternalStore(subscribe, read)
}
