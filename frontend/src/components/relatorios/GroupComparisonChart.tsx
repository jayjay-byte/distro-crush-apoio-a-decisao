import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { GrupoResultado } from '../../api/types'
import { useChartColors } from '../../hooks/useChartColors'
import { formatPercent } from '../../utils/format'
import { ChartPanel, LegendItem } from '../charts/ChartPanel'
import { ChartTooltip } from '../charts/ChartTooltip'
import { tooltipItem, type TooltipProps } from '../charts/tooltip'

const BAR_ROW = 40
const NOME_WIDTH = 124
/** Caracteres por linha no nome do grupo (eixo vertical quebra em até 2 linhas). */
const LINHA_MAX = 18

type Linha = { nome: string; ia: number; rotulo: GrupoResultado['rotulo']; percentual: number; primeiro: boolean }

/** Quebra o nome em linhas de até `LINHA_MAX` caracteres, por palavra. */
function quebrar(nome: string): string[] {
  const linhas: string[] = []
  for (const palavra of nome.split(' ')) {
    const ultima = linhas[linhas.length - 1]
    if (ultima !== undefined && `${ultima} ${palavra}`.length <= LINHA_MAX) linhas[linhas.length - 1] = `${ultima} ${palavra}`
    else linhas.push(palavra)
  }
  return linhas
}

type TickProps = { x?: number | string; y?: number | string; payload?: { value: string } }

/** "Comparativo do IA por grupo" (Figma 10:23528): IA de cada grupo, escala de 0 a 100%. */
export function GroupComparisonChart({ grupos }: { grupos: GrupoResultado[] }) {
  const cores = useChartColors()
  const dados: Linha[] = grupos.map((g, i) => ({
    nome: g.nome,
    ia: g.ia,
    rotulo: g.rotulo,
    percentual: g.ia * 100,
    primeiro: i === 0,
  }))

  function NomeTick({ x = 0, y = 0, payload }: TickProps) {
    const linhas = quebrar(payload?.value ?? '')
    return (
      <text x={Number(x) - NOME_WIDTH + 4} y={y} fill={cores.fg} fontSize={11} textAnchor="start">
        {linhas.map((linha, i) => (
          <tspan key={i} x={Number(x) - NOME_WIDTH + 4} dy={i === 0 ? (1 - linhas.length) * 6.5 + 4 : 13}>
            {linha}
          </tspan>
        ))}
      </text>
    )
  }

  return (
    <ChartPanel
      title="Comparativo do IA por grupo"
      description="IA do grupo · escala de 0 a 100%"
      legend={
        <div className="flex flex-wrap gap-4">
          <LegendItem color={cores.bar}>1º grupo</LegendItem>
          <LegendItem color={cores.serie3}>Demais grupos</LegendItem>
        </div>
      }
    >
      <div style={{ height: dados.length * BAR_ROW + 28 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dados} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 0 }} barCategoryGap={9}>
            <XAxis
              type="number"
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tickFormatter={(v: number) => `${v}%`}
              axisLine={false}
              tickLine={false}
              tick={{ fill: cores.axis, fontSize: 10 }}
            />
            <YAxis type="category" dataKey="nome" width={NOME_WIDTH} axisLine={false} tickLine={false} tick={NomeTick} />
            <Tooltip
              cursor={{ fill: cores.track }}
              content={(props: TooltipProps<Linha>) => {
                const l = tooltipItem(props)
                return l ? (
                  <ChartTooltip title={l.nome}>
                    IA do grupo {formatPercent(l.ia)} · {l.rotulo}
                  </ChartTooltip>
                ) : null
              }}
            />
            <Bar
              dataKey="percentual"
              name="IA do grupo"
              radius={[0, 4, 4, 0]}
              background={{ fill: cores.track }}
              isAnimationActive={false}
            >
              {dados.map((l) => (
                <Cell key={l.nome} fill={l.primeiro ? cores.bar : cores.serie3} />
              ))}
              <LabelList
                dataKey="ia"
                position="right"
                fill={cores.fg}
                fontSize={11}
                fontWeight={600}
                formatter={(ia: unknown) => formatPercent(Number(ia))}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartPanel>
  )
}
