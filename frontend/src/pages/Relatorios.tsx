import { Download, Share2 } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router'
import { getSimulacao, listarSimulacoes } from '../api/relatorios'
import type { SimulacaoDetalhe } from '../api/types'
import { useAuth } from '../auth/authContext'
import { FilterBar } from '../components/filters/FilterBar'
import { PageHeader } from '../components/layout/PageHeader'
import { GroupComparisonChart } from '../components/relatorios/GroupComparisonChart'
import { InterpretacaoCards } from '../components/relatorios/InterpretacaoCards'
import { RespostasGrid } from '../components/relatorios/RespostasGrid'
import { SensibilidadePanel } from '../components/relatorios/SensibilidadePanel'
import { SimulacoesTable } from '../components/relatorios/SimulacoesTable'
import { ResultView } from '../components/result/ResultView'
import { Button } from '../components/ui/Button'
import { Chip } from '../components/ui/Chip'
import { ErrorAlert } from '../components/ui/ErrorAlert'
import { FutureFeature } from '../components/ui/FutureFeature'
import { LoadingCard } from '../components/ui/LoadingCard'
import { NoSimulations } from '../components/ui/NoSimulations'
import { useRequest } from '../hooks/useRequest'
import { formatDataHora } from '../utils/format'

const POR_PAGINA = 10

/** Inteiro positivo do parâmetro da URL, ou `null`. */
function inteiro(valor: string | null): number | null {
  if (valor === null || !/^\d+$/.test(valor)) return null
  const n = Number(valor)
  return n >= 1 ? n : null
}

function plural(n: number, singular: string, pluralForm: string): string {
  return `${n} ${n === 1 ? singular : pluralForm}`
}

/** Detalhe da simulação selecionada: respostas, ranking (snapshot), comparativo, sensibilidade e interpretação. */
function DetalheSimulacao({ simulacao }: { simulacao: SimulacaoDetalhe }) {
  const { usuario } = useAuth()
  const { resultado, respostas } = simulacao
  const grupos = resultado.grupos.length

  return (
    <>
      <section className="flex flex-col gap-3 rounded-lg border border-line bg-card p-4 sm:flex-row sm:items-start lg:p-5">
        <div className="flex flex-1 flex-col gap-1">
          <p className="text-small font-semibold text-accent">SIMULAÇÃO SELECIONADA · #{simulacao.id}</p>
          <h2 className="text-title font-extrabold text-fg">{simulacao.perfil}</h2>
          <p className="text-label text-fg-muted">
            {usuario ? `${usuario.login} · ` : ''}
            {formatDataHora(simulacao.data)}
          </p>
        </div>
        <Chip className="self-start">Salva</Chip>
      </section>

      <RespostasGrid respostas={respostas} />

      <section aria-label="Ranking de grupos" className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-title font-extrabold text-fg">Grupos por Índice de Aderência (IA)</h2>
          <p className="text-body text-fg-muted">
            {grupos > 0 &&
              `${plural(grupos, 'grupo', 'grupos')} com distros compatíveis, em ordem decrescente do IA do grupo. `}
            Quanto a distro atende às suas respostas, não é chance de sucesso.
          </p>
        </div>
        {resultado.compativeis === 0 ? (
          <p className="rounded-lg border border-dashed border-line p-6 text-center text-body text-fg-muted">
            Nenhuma distro passou na triagem nesta simulação.
          </p>
        ) : (
          // Snapshot salvo: os mesmos componentes da Simulação, sem recalcular.
          <ResultView key={simulacao.id} resultado={resultado} />
        )}
      </section>

      {grupos > 0 && <GroupComparisonChart grupos={resultado.grupos} />}

      <SensibilidadePanel simulacaoId={simulacao.id} />

      <InterpretacaoCards resultado={resultado} respostas={respostas} />
    </>
  )
}

/**
 * Relatórios (Figma 10:23293 / 10:23575): simulações salvas com paginação e o
 * relatório da selecionada. A seleção e a página ficam na URL
 * (`/relatorios?simulacao=ID&pagina=N`), para o "Ver relatório" do Dashboard.
 */
export default function Relatorios() {
  const [params, setParams] = useSearchParams()
  const pagina = inteiro(params.get('pagina')) ?? 1
  const selecionada = inteiro(params.get('simulacao'))

  const lista = useRequest(
    `simulacoes:${pagina}`,
    () => listarSimulacoes(pagina, POR_PAGINA),
    'Não foi possível carregar suas simulações.',
  )
  const detalhe = useRequest(
    `simulacao:${selecionada ?? 'nenhuma'}`,
    () => (selecionada ? getSimulacao(selecionada) : Promise.resolve(null)),
    'Não foi possível carregar a simulação.',
  )

  const detalheRef = useRef<HTMLDivElement>(null)

  function atualizarUrl(patch: { simulacao?: number; pagina?: number }, replace = false) {
    const next = new URLSearchParams(params)
    if (patch.simulacao !== undefined) next.set('simulacao', String(patch.simulacao))
    if (patch.pagina !== undefined) {
      if (patch.pagina > 1) next.set('pagina', String(patch.pagina))
      else next.delete('pagina')
    }
    setParams(next, { replace })
  }

  const dadosLista = lista.data
  useEffect(() => {
    if (!dadosLista) return
    const { total, total_paginas: totalPaginas, itens } = dadosLista
    const next = new URLSearchParams(params)
    let mudou = false
    // Página além da última (ex.: URL antiga): vai para a última.
    if (total > 0 && pagina > totalPaginas) {
      next.set('pagina', String(totalPaginas))
      mudou = true
    } else if (selecionada === null && itens.length > 0) {
      // Sem seleção na URL: a mais recente da página.
      next.set('simulacao', String(itens[0].id))
      mudou = true
    }
    if (mudou) setParams(next, { replace: true })
  }, [dadosLista, pagina, selecionada, params, setParams])

  function selecionar(id: number) {
    atualizarUrl({ simulacao: id })
    // No mobile o detalhe fica abaixo da lista: leva o usuário até ele.
    if (window.matchMedia('(max-width: 1023px)').matches) {
      detalheRef.current?.scrollIntoView({ block: 'start' })
    }
  }

  const vazio = dadosLista?.total === 0

  return (
    <>
      <PageHeader
        eyebrow="HISTÓRICO E EVIDÊNCIAS"
        title="Relatórios"
        description="Escolha uma simulação para ver as respostas, o ranking e as justificativas."
        actions={
          <div className="flex flex-wrap gap-2">
            <FutureFeature>
              <Button icon={Download} disabled>
                Exportar PDF
              </Button>
            </FutureFeature>
            <FutureFeature>
              <Button variant="secondary" icon={Share2} disabled>
                Compartilhar
              </Button>
            </FutureFeature>
          </div>
        }
      />

      <FilterBar
        selects={[
          { label: 'Propósito', placeholder: 'Todos os propósitos' },
          { label: 'Distro no 1º grupo', placeholder: 'Todas as distros' },
        ]}
        resumo={dadosLista ? plural(dadosLista.total, 'simulação', 'simulações') : undefined}
      />

      {lista.loading ? (
        <LoadingCard>Carregando suas simulações…</LoadingCard>
      ) : lista.error || !dadosLista ? (
        <ErrorAlert message={lista.error ?? 'Não foi possível carregar suas simulações.'} onRetry={lista.retry} />
      ) : vazio ? (
        <NoSimulations />
      ) : (
        <>
          <SimulacoesTable
            pagina={dadosLista}
            selecionada={selecionada}
            onSelect={selecionar}
            onPage={(p) => atualizarUrl({ pagina: p })}
          />

          <div ref={detalheRef} className="flex scroll-mt-36 flex-col gap-5 lg:scroll-mt-24">
            {selecionada === null ? null : detalhe.loading ? (
              <LoadingCard>Carregando a simulação…</LoadingCard>
            ) : detalhe.error || !detalhe.data ? (
              <ErrorAlert
                message={`${(detalhe.error ?? 'Não foi possível carregar a simulação').replace(/\.$/, '')}. Escolha outra simulação na tabela.`}
                onRetry={detalhe.retry}
              />
            ) : (
              <DetalheSimulacao simulacao={detalhe.data} />
            )}
          </div>
        </>
      )}

      <p className="text-small text-fg-subtle">O sistema apoia a decisão; a escolha final é sua.</p>
    </>
  )
}
