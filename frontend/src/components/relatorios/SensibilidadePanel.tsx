import { ArrowDown, ArrowUp, Equal, Repeat2, ShieldCheck } from 'lucide-react'
import { getSensibilidade } from '../../api/relatorios'
import type { GrupoRanking, RankingGrupos } from '../../api/types'
import { useRequest } from '../../hooks/useRequest'
import { formatPercent } from '../../utils/format'
import { IaBar } from '../result/IaBar'
import { RotuloBadge } from '../result/RotuloBadge'
import { Alert } from '../ui/Alert'
import { ErrorAlert } from '../ui/ErrorAlert'
import { LoadingCard } from '../ui/LoadingCard'
import { Panel } from '../ui/Panel'

const DESCRICAO =
  'Ranking de grupos recalculado com as respostas salvas e a base atual: pesos ROC (usados no resultado) × pesos iguais (1/6 cada).'

function posicoes(n: number): string {
  return `${n} ${n === 1 ? 'posição' : 'posições'}`
}

/** Variação de posição do grupo com pesos iguais em relação ao ROC (pelo nome do grupo). */
function Variacao({ grupo, roc }: { grupo: GrupoRanking; roc: RankingGrupos }) {
  const anterior = roc.grupos.find((g) => g.nome === grupo.nome)
  if (!anterior) {
    return <span className="text-small font-semibold text-accent">novo</span>
  }
  const delta = anterior.posicao - grupo.posicao
  const [Icon, texto, cor] =
    delta > 0
      ? [ArrowUp, `subiu ${posicoes(delta)}`, 'text-accent']
      : delta < 0
        ? [ArrowDown, `desceu ${posicoes(-delta)}`, 'text-fg-muted']
        : [Equal, 'manteve a posição', 'text-fg-subtle']
  return (
    <span title={texto} className={`inline-flex w-8 shrink-0 items-center justify-end gap-0.5 text-small font-semibold ${cor}`}>
      <Icon aria-hidden className="size-3.5" />
      {delta !== 0 && <span aria-hidden>{Math.abs(delta)}</span>}
      <span className="sr-only">{texto}</span>
    </span>
  )
}

type ColunaProps = {
  titulo: string
  ranking: RankingGrupos
  /** Ranking ROC, para mostrar a variação de posição (só na coluna de pesos iguais). */
  roc?: RankingGrupos
}

function Coluna({ titulo, ranking, roc }: ColunaProps) {
  return (
    <section className="flex min-w-0 flex-col gap-2">
      <h3 className="text-label font-semibold text-fg-muted">{titulo}</h3>
      {ranking.grupos.length === 0 ? (
        <p className="rounded-md border border-dashed border-line p-4 text-center text-label text-fg-muted">
          Nenhum grupo exibido.
        </p>
      ) : (
        <ol className="flex flex-col gap-2">
          {ranking.grupos.map((g, i) => (
            <li
              key={g.nome}
              className={`flex flex-col gap-2 rounded-md border p-3 ${
                i === 0 ? 'border-primary-soft-border bg-highlight' : 'border-line'
              }`}
            >
              <div className="flex items-start gap-2">
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="text-body font-semibold text-fg">
                    {g.posicao}º · {g.nome}
                  </p>
                  <p className="text-small text-fg-muted">
                    {g.distros} {g.distros === 1 ? 'distro' : 'distros'}
                  </p>
                </div>
                <span className="text-lead font-extrabold text-accent">{formatPercent(g.ia)}</span>
                <RotuloBadge rotulo={g.rotulo} />
                {roc && <Variacao grupo={g} roc={roc} />}
              </div>
              <IaBar ia={g.ia} />
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

/**
 * Análise de sensibilidade (sem frame no Figma; layout aprovado na Fase 4c):
 * alerta se o 1º grupo se manteve + rankings ROC e pesos iguais lado a lado,
 * com a variação de posição na coluna de pesos iguais. Carrega à parte.
 */
export function SensibilidadePanel({ simulacaoId }: { simulacaoId: number }) {
  const { data, loading, error, retry } = useRequest(
    `sensibilidade:${simulacaoId}`,
    () => getSensibilidade(simulacaoId),
    'Não foi possível carregar a análise de sensibilidade.',
  )

  return (
    <Panel title="Análise de sensibilidade" description={DESCRICAO}>
      {loading ? (
        <LoadingCard>Calculando a sensibilidade…</LoadingCard>
      ) : error || !data ? (
        <ErrorAlert message={error ?? 'Não foi possível carregar a análise de sensibilidade.'} onRetry={retry} />
      ) : data.roc.grupos.length === 0 && data.iguais.grupos.length === 0 ? (
        <p className="rounded-md border border-dashed border-line p-6 text-center text-body text-fg-muted">
          Nenhum grupo exibido nos dois cenários.
        </p>
      ) : (
        <>
          {data.mesmo_primeiro_grupo ? (
            <Alert icon={ShieldCheck} title={`O 1º grupo se manteve: ${data.roc.primeiro_grupo?.nome ?? '—'}`}>
              Com pesos iguais, o grupo mais aderente continua o mesmo.
            </Alert>
          ) : (
            <Alert
              icon={Repeat2}
              title={`O 1º grupo mudou: ${data.roc.primeiro_grupo?.nome ?? 'nenhum grupo'} com pesos ROC; ${
                data.iguais.primeiro_grupo?.nome ?? 'nenhum grupo'
              } com pesos iguais.`}
            >
              O grupo mais aderente depende da importância dada a cada critério.
            </Alert>
          )}
          <div className="grid gap-4 lg:grid-cols-2">
            <Coluna titulo="Pesos ROC (usados)" ranking={data.roc} />
            <Coluna titulo="Pesos iguais" ranking={data.iguais} roc={data.roc} />
          </div>
        </>
      )}
    </Panel>
  )
}
