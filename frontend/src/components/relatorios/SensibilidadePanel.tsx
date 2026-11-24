import { ArrowDown, ArrowUp, Equal, Repeat2, ShieldCheck } from 'lucide-react'
import { getSensibilidade } from '../../api/relatorios'
import type { GrupoRanking, RankingGrupos, SensibilidadeOut } from '../../api/types'
import { useRequest } from '../../hooks/useRequest'
import { formatPercent } from '../../utils/format'
import { IaBar } from '../result/IaBar'
import { RotuloBadge } from '../result/RotuloBadge'
import { Alert } from '../ui/Alert'
import { ErrorAlert } from '../ui/ErrorAlert'
import { LoadingCard } from '../ui/LoadingCard'
import { Panel } from '../ui/Panel'

/** Rótulo da API no meio da frase: "Seus pesos" → "seus pesos", "Pesos ROC" → "pesos ROC". */
function meioDeFrase(rotulo: string): string {
  return rotulo.charAt(0).toLowerCase() + rotulo.slice(1)
}

function descricao(data: SensibilidadeOut | null): string {
  const base = 'Ranking de grupos recalculado com as respostas salvas e a base atual'
  if (!data) return `${base}.`
  const alternativo =
    data.comparacao === 'roc_iguais' ? `${meioDeFrase(data.alternativo.rotulo)} (1/6 cada)` : meioDeFrase(data.alternativo.rotulo)
  return `${base}: ${meioDeFrase(data.principal.rotulo)} (usados no resultado) × ${alternativo}.`
}

function posicoes(n: number): string {
  return `${n} ${n === 1 ? 'posição' : 'posições'}`
}

/** Variação de posição do grupo no cenário alternativo em relação ao principal (pelo nome do grupo). */
function Variacao({ grupo, principal }: { grupo: GrupoRanking; principal: RankingGrupos }) {
  const anterior = principal.grupos.find((g) => g.nome === grupo.nome)
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
  /** Ranking principal, para mostrar a variação de posição (só na coluna alternativa). */
  principal?: RankingGrupos
}

function Coluna({ titulo, ranking, principal }: ColunaProps) {
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
                {principal && <Variacao grupo={g} principal={principal} />}
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
 * alerta se o 1º grupo se manteve + rankings principal e alternativo lado a
 * lado (seus pesos × ROC, ou ROC × pesos iguais, com os rótulos da API), com a
 * variação de posição na coluna alternativa. Carrega à parte.
 */
export function SensibilidadePanel({ simulacaoId }: { simulacaoId: number }) {
  const { data, loading, error, retry } = useRequest(
    `sensibilidade:${simulacaoId}`,
    () => getSensibilidade(simulacaoId),
    'Não foi possível carregar a análise de sensibilidade.',
  )

  return (
    <Panel title="Análise de sensibilidade" description={descricao(data)}>
      {loading ? (
        <LoadingCard>Calculando a sensibilidade…</LoadingCard>
      ) : error || !data ? (
        <ErrorAlert message={error ?? 'Não foi possível carregar a análise de sensibilidade.'} onRetry={retry} />
      ) : data.principal.ranking.grupos.length === 0 && data.alternativo.ranking.grupos.length === 0 ? (
        <p className="rounded-md border border-dashed border-line p-6 text-center text-body text-fg-muted">
          Nenhum grupo exibido nos dois cenários.
        </p>
      ) : (
        <>
          {data.mesmo_primeiro_grupo ? (
            <Alert
              icon={ShieldCheck}
              title={`O 1º grupo se manteve: ${data.principal.ranking.primeiro_grupo?.nome ?? '—'}`}
            >
              Com {meioDeFrase(data.alternativo.rotulo)}, o grupo mais aderente continua o mesmo.
            </Alert>
          ) : (
            <Alert
              icon={Repeat2}
              title={`O 1º grupo mudou: ${data.principal.ranking.primeiro_grupo?.nome ?? 'nenhum grupo'} com ${meioDeFrase(
                data.principal.rotulo,
              )}; ${data.alternativo.ranking.primeiro_grupo?.nome ?? 'nenhum grupo'} com ${meioDeFrase(
                data.alternativo.rotulo,
              )}.`}
            >
              O grupo mais aderente depende da importância dada a cada critério.
            </Alert>
          )}
          <div className="grid gap-4 lg:grid-cols-2">
            <Coluna titulo={`${data.principal.rotulo} (usados)`} ranking={data.principal.ranking} />
            <Coluna
              titulo={data.alternativo.rotulo}
              ranking={data.alternativo.ranking}
              principal={data.principal.ranking}
            />
          </div>
        </>
      )}
    </Panel>
  )
}
