import { MousePointer2 } from 'lucide-react'
import { useState } from 'react'
import { Bar, BarChart, LabelList, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import type { DistroContagem } from '../../api/types'
import { useChartColors } from '../../hooks/useChartColors'
import { ChartPanel, LegendItem } from '../charts/ChartPanel'

/** Distros exibidas no gráfico (as primeiras do ranking da API). */
const MAX_DISTROS = 5
const BAR_ROW = 34

type TopDistrosChartProps = {
  distros: DistroContagem[]
  totalSimulacoes: number
}

/**
 * "Distros mais recomendadas" (Figma 51:448): quantas vezes cada distro foi a de
 * maior IA. A caixa abaixo do gráfico acompanha a barra em foco (a 1ª por padrão).
 */
export function TopDistrosChart({ distros, totalSimulacoes }: TopDistrosChartProps) {
  const cores = useChartColors()
  const [ativa, setAtiva] = useState(0)
  const dados = distros.slice(0, MAX_DISTROS)
  const foco = dados[ativa] ?? dados[0]
  const maximo = Math.max(...dados.map((d) => d.vezes), 1)

  const descricao =
    'Quantas vezes cada distro foi a mais aderente às suas respostas' +
    (distros.length > MAX_DISTROS ? ` · as ${MAX_DISTROS} primeiras de ${distros.length}` : '')

  return (
    <ChartPanel
      title="Distros mais recomendadas"
      description={descricao}
      legend={<LegendItem color={cores.bar}>Vezes como distro de maior IA</LegendItem>}
    >
      <div style={{ height: dados.length * BAR_ROW + 28 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={dados}
            layout="vertical"
            margin={{ top: 0, right: 28, bottom: 0, left: 0 }}
            barCategoryGap={7}
            onMouseLeave={() => setAtiva(0)}
          >
            <XAxis
              type="number"
              domain={[0, maximo]}
              allowDecimals={false}
              tickCount={Math.min(maximo, 4) + 1}
              axisLine={false}
              tickLine={false}
              tick={{ fill: cores.axis, fontSize: 10 }}
            />
            <YAxis
              type="category"
              dataKey="nome"
              width={92}
              axisLine={false}
              tickLine={false}
              tick={{ fill: cores.fg, fontSize: 11 }}
            />
            <Bar
              dataKey="vezes"
              name="Vezes como distro de maior IA"
              fill={cores.bar}
              radius={[0, 4, 4, 0]}
              background={{ fill: cores.track }}
              isAnimationActive={false}
              onMouseEnter={(_, index) => setAtiva(index)}
              onClick={(_, index) => setAtiva(index)}
            >
              <LabelList dataKey="vezes" position="right" fill={cores.fg} fontSize={11} fontWeight={600} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {foco && (
        <p aria-live="polite" className="flex items-center gap-2 rounded-md bg-primary-soft p-2 text-small text-on-primary-soft">
          <MousePointer2 aria-hidden className="size-3.25 shrink-0" />
          {foco.nome} · foi a mais aderente em {foco.vezes} das suas {totalSimulacoes} simulações
        </p>
      )}
    </ChartPanel>
  )
}
