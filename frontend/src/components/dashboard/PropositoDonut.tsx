import { Cell, Pie, PieChart, Tooltip } from 'recharts'
import type { PropositoContagem } from '../../api/types'
import { useChartColors, type ChartColors } from '../../hooks/useChartColors'
import { formatFracao } from '../../utils/format'
import { ChartPanel } from '../charts/ChartPanel'
import { ChartTooltip } from '../charts/ChartTooltip'
import { tooltipItem, type TooltipProps } from '../charts/tooltip'

const SIZE = 174
const ESPESSURA = 27

/** A cor segue a categoria (ordem fixa da API), nunca a posição no ranking. */
const COR_PROPOSITO: Record<PropositoContagem['proposito'], keyof ChartColors> = {
  geral: 'serie1',
  jogos: 'serie2',
  seguranca: 'serie3',
  hardware_antigo: 'serie4',
}

/** "uso geral", "uso geral e jogos", "a, b e c". */
function juntar(nomes: string[]): string {
  if (nomes.length <= 1) return nomes.join('')
  return `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}`
}

/** "Você simulou mais para uso geral." (empate: todos os empatados). */
function resumo(propositos: PropositoContagem[]): string {
  const maior = Math.max(...propositos.map((p) => p.total))
  const lideres = propositos.filter((p) => p.total === maior).map((p) => p.rotulo.toLowerCase())
  return `Você simulou mais para ${juntar(lideres)}.`
}

function plural(n: number): string {
  return `${n} ${n === 1 ? 'simulação' : 'simulações'}`
}

/** "Minhas simulações por propósito" (Figma 51:491): rosca + legenda com "N · xx,x%". */
export function PropositoDonut({ propositos, total }: { propositos: PropositoContagem[]; total: number }) {
  const cores = useChartColors()
  // Categoria com 0 fica só na legenda (sem fatia).
  const fatias = propositos.filter((p) => p.total > 0)

  return (
    <ChartPanel title="Minhas simulações por propósito" description={`Distribuição das suas ${plural(total)}`}>
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
        <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
          <PieChart width={SIZE} height={SIZE}>
            <Pie
              data={fatias}
              dataKey="total"
              nameKey="rotulo"
              innerRadius={SIZE / 2 - ESPESSURA}
              outerRadius={SIZE / 2}
              startAngle={90}
              endAngle={-270}
              // 2px da cor do card entre as fatias: separa os tons vizinhos.
              stroke={cores.card}
              strokeWidth={2}
              isAnimationActive={false}
            >
              {fatias.map((p) => (
                <Cell key={p.proposito} fill={cores[COR_PROPOSITO[p.proposito]]} />
              ))}
            </Pie>
            <Tooltip
              content={(props: TooltipProps<PropositoContagem>) => {
                const p = tooltipItem(props)
                return p ? (
                  <ChartTooltip title={p.rotulo}>
                    {plural(p.total)} · {formatFracao(p.total, total)}
                  </ChartTooltip>
                ) : null
              }}
            />
          </PieChart>
          <div aria-hidden className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-title font-extrabold text-fg">{total}</span>
            <span className="text-small text-fg-muted">{total === 1 ? 'simulação' : 'simulações'}</span>
          </div>
        </div>

        <ul className="grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto sm:flex-1 sm:flex-col">
          {propositos.map((p) => (
            <li key={p.proposito} className="flex flex-col gap-1">
              <span className="flex items-center gap-1.75 text-label text-fg">
                <span
                  aria-hidden
                  className="size-2.25 shrink-0"
                  style={{ backgroundColor: cores[COR_PROPOSITO[p.proposito]] }}
                />
                {p.rotulo}
              </span>
              <span className="text-body font-semibold text-fg">
                {p.total} · {formatFracao(p.total, total)}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-small text-fg-muted">{resumo(propositos)}</p>
    </ChartPanel>
  )
}
