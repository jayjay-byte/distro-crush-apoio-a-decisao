import { CartesianGrid, LabelList, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { PontoIA } from '../../api/types'
import { useChartColors } from '../../hooks/useChartColors'
import { formatDataHora, formatDiaMes, formatPercent } from '../../utils/format'
import { ChartPanel, LegendItem } from '../charts/ChartPanel'
import { ChartTooltip } from '../charts/ChartTooltip'
import { tooltipItem, type TooltipProps } from '../charts/tooltip'

/** Com mais pontos que isso, só o último recebe rótulo (evita números sobrepostos). */
const MAX_ROTULOS = 12

type Ponto = PontoIA & { indice: number; percentual: number; rotuloPonto: string }

function plural(n: number): string {
  return `${n} ${n === 1 ? 'simulação' : 'simulações'}`
}

/**
 * "IA do 1º grupo por simulação" (Figma 51:520), da mais antiga para a mais recente.
 * Eixo Y em %: começa no múltiplo de 10 abaixo do menor IA (como os 70–100 do Figma)
 * e termina em 100, sem esconder IA baixos.
 */
export function IaLineChart({ pontos, totalSimulacoes }: { pontos: PontoIA[]; totalSimulacoes: number }) {
  const cores = useChartColors()
  const ultimo = pontos[pontos.length - 1]

  const rotularTodos = pontos.length <= MAX_ROTULOS
  const dados: Ponto[] = pontos.map((p, indice) => ({
    ...p,
    indice,
    percentual: p.ia * 100,
    // % inteiro, como no resto do Dashboard (sem o símbolo, como no Figma).
    rotuloPonto: rotularTodos || indice === pontos.length - 1 ? String(Math.round(p.ia * 100)) : '',
  }))
  const minimo = Math.min(...dados.map((p) => p.percentual))
  const inicio = Math.max(0, Math.min(Math.floor(minimo / 10) * 10, 90))
  const ticks = Array.from({ length: (100 - inicio) / 10 + 1 }, (_, i) => inicio + i * 10)

  const semGrupos = totalSimulacoes - pontos.length
  const descricao =
    `Suas ${plural(totalSimulacoes)}, da mais antiga para a mais recente` +
    (semGrupos > 0 ? ` · ${plural(semGrupos)} sem grupos ${semGrupos === 1 ? 'fica' : 'ficam'} fora da linha` : '')

  return (
    <ChartPanel
      title="IA do 1º grupo por simulação"
      description={descricao}
      legend={
        ultimo && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <LegendItem color={cores.bar} shape="line">
              IA (%)
            </LegendItem>
            <p className="text-small text-accent">
              Última: {formatPercent(ultimo.ia)} · {ultimo.rotulo}
            </p>
          </div>
        )
      }
    >
      {ultimo ? (
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dados} margin={{ top: 18, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke={cores.grid} />
              <XAxis
                dataKey="indice"
                tickFormatter={(i: number) => (dados[i] ? formatDiaMes(dados[i].data) : '')}
                axisLine={false}
                tickLine={false}
                tick={{ fill: cores.fgMuted, fontSize: 10 }}
                padding={{ left: 12, right: 12 }}
                minTickGap={16}
              />
              <YAxis
                domain={[inicio, 100]}
                ticks={ticks}
                width={30}
                axisLine={false}
                tickLine={false}
                tick={{ fill: cores.axis, fontSize: 10 }}
              />
              <Tooltip
                cursor={{ stroke: cores.grid }}
                content={(props: TooltipProps<Ponto>) => {
                  const p = tooltipItem(props)
                  return p ? (
                    <ChartTooltip title={formatDataHora(p.data)}>
                      <p>{p.grupo}</p>
                      <p>
                        IA do grupo {formatPercent(p.ia)} · {p.rotulo}
                      </p>
                    </ChartTooltip>
                  ) : null
                }}
              />
              <Line
                type="linear"
                dataKey="percentual"
                name="IA (%)"
                stroke={cores.bar}
                strokeWidth={2}
                dot={{ r: 4, fill: cores.bar, stroke: cores.card, strokeWidth: 2 }}
                activeDot={{ r: 5, fill: cores.bar, stroke: cores.card, strokeWidth: 2 }}
                isAnimationActive={false}
              >
                <LabelList
                  dataKey="rotuloPonto"
                  position="top"
                  offset={8}
                  fill={cores.label}
                  fontSize={10}
                  fontWeight={600}
                />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="rounded-md border border-dashed border-line p-6 text-center text-body text-fg-muted">
          Nenhuma simulação exibiu grupos, então não há IA do 1º grupo para mostrar.
        </p>
      )}
    </ChartPanel>
  )
}
