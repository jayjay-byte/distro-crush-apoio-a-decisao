import { FlaskConical, Layers, Plus, Trophy } from 'lucide-react'
import { useNavigate } from 'react-router'
import { getDashboard } from '../api/relatorios'
import type { DashboardOut } from '../api/types'
import { IaLineChart } from '../components/dashboard/IaLineChart'
import { PropositoDonut } from '../components/dashboard/PropositoDonut'
import { TopDistrosChart } from '../components/dashboard/TopDistrosChart'
import { UltimaSimulacaoCard } from '../components/dashboard/UltimaSimulacaoCard'
import { FilterBar } from '../components/filters/FilterBar'
import { PageHeader } from '../components/layout/PageHeader'
import { IaBar } from '../components/result/IaBar'
import { Button } from '../components/ui/Button'
import { ErrorAlert } from '../components/ui/ErrorAlert'
import { LoadingCard } from '../components/ui/LoadingCard'
import { NoSimulations } from '../components/ui/NoSimulations'
import { StatCard } from '../components/ui/StatCard'
import { useRequest } from '../hooks/useRequest'
import { formatData, formatPercent } from '../utils/format'

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

function plural(n: number, singular: string, pluralForm: string): string {
  return `${n} ${n === 1 ? singular : pluralForm}`
}

/** Mês corrente em UTC, o mesmo usado pela API em `simulacoes_mes_atual`. */
function mesAtual(): string {
  return MESES[new Date().getUTCMonth()]
}

function Indicadores({ dados }: { dados: DashboardOut }) {
  const grupo = dados.ultima_simulacao?.primeiro_grupo ?? null
  const top = dados.distros_mais_recomendadas[0]

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <StatCard title="Minhas simulações" icon={FlaskConical} value={String(dados.total_simulacoes)}>
        <p className="text-small text-fg-muted">
          {dados.simulacoes_mes_atual} em {mesAtual()}
          {dados.ultima_simulacao_em && ` · última em ${formatData(dados.ultima_simulacao_em)}`}
        </p>
      </StatCard>

      <StatCard title="Índice de Aderência (IA) do 1º grupo" icon={Layers} value={grupo ? formatPercent(grupo.ia) : '—'}>
        {grupo ? (
          <>
            <IaBar ia={grupo.ia} size="grupo" />
            <p className="text-small text-fg-muted">
              {grupo.rotulo} · Quanto a distro atende às suas respostas, não é chance de sucesso.
            </p>
          </>
        ) : (
          <p className="text-small text-fg-muted">A última simulação não exibiu grupos.</p>
        )}
      </StatCard>

      <StatCard title="Distro mais recomendada" icon={Trophy} value={top ? top.nome : '—'}>
        <p className="text-small text-fg-muted">
          {top
            ? `${plural(top.vezes, 'vez', 'vezes')} como a de maior IA`
            : 'Nenhuma simulação teve distro compatível.'}
        </p>
      </StatCard>
    </div>
  )
}

/**
 * Dashboard principal (Figma 51:333 / 10:22490): indicadores e gráficos das
 * simulações salvas do usuário logado (GET /dashboard). Os filtros ficam só no visual.
 */
export default function Dashboard() {
  const navigate = useNavigate()
  const { data, loading, error, retry } = useRequest('dashboard', getDashboard, 'Não foi possível carregar o dashboard.')

  return (
    <>
      <PageHeader
        eyebrow="MEU PAINEL"
        title="Meu dashboard"
        description="Acompanhe suas simulações e compare os resultados antes de decidir."
        actions={
          <Button icon={Plus} onClick={() => navigate('/simulacao')} className="self-start sm:self-auto">
            Nova simulação
          </Button>
        }
      />

      <FilterBar
        selects={[{ label: 'Propósito', placeholder: 'Todos os propósitos' }]}
        resumo={data ? plural(data.total_simulacoes, 'simulação sua', 'simulações suas') : undefined}
      />

      {loading ? (
        <LoadingCard>Carregando o dashboard…</LoadingCard>
      ) : error || !data ? (
        <ErrorAlert message={error ?? 'Não foi possível carregar o dashboard.'} onRetry={retry} />
      ) : data.total_simulacoes === 0 ? (
        <NoSimulations />
      ) : (
        <>
          <Indicadores dados={data} />
          <div className="grid items-start gap-4 lg:grid-cols-2">
            {data.distros_mais_recomendadas.length > 0 ? (
              <TopDistrosChart distros={data.distros_mais_recomendadas} totalSimulacoes={data.total_simulacoes} />
            ) : (
              <p className="rounded-lg border border-dashed border-line p-6 text-center text-body text-fg-muted">
                Nenhuma simulação teve distro compatível, então não há distros recomendadas.
              </p>
            )}
            <PropositoDonut propositos={data.simulacoes_por_proposito} total={data.total_simulacoes} />
          </div>
          <IaLineChart pontos={data.ia_primeiro_grupo_por_simulacao} totalSimulacoes={data.total_simulacoes} />
          {data.ultima_simulacao && <UltimaSimulacaoCard ultima={data.ultima_simulacao} />}
        </>
      )}

      <p className="text-small text-fg-subtle">O sistema apoia a decisão; a escolha final é sua.</p>
    </>
  )
}
