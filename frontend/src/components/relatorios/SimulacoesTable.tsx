import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { SimulacaoPagina, SimulacaoResumo } from '../../api/types'
import { formatData, formatPercent } from '../../utils/format'
import { Panel } from '../ui/Panel'

function primeiroGrupo(s: SimulacaoResumo): string {
  const g = s.primeiro_grupo
  return g ? `${g.nome} · ${formatPercent(g.ia)} (${g.rotulo})` : 'Sem grupos'
}

function maiorIa(s: SimulacaoResumo): string {
  const d = s.distro_maior_ia
  return d ? `${d.nome} · ${formatPercent(d.ia)}` : '—'
}

/** Números de página com reticências: 1 … 4 5 6 … 12. */
function paginas(atual: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const meio = [atual - 1, atual, atual + 1].filter((p) => p > 1 && p < total)
  return [1, ...(meio[0] > 2 ? [null] : []), ...meio, ...(meio[meio.length - 1] < total - 1 ? [null] : []), total]
}

const PAGE_BUTTON =
  'inline-flex size-8 items-center justify-center rounded-md border text-label font-semibold transition focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40'

type SimulacoesTableProps = {
  pagina: SimulacaoPagina
  selecionada: number | null
  onSelect: (id: number) => void
  onPage: (pagina: number) => void
}

/**
 * "Minhas simulações" (Figma 10:23373): tabela no desktop, lista de cards no
 * mobile (10:23575), com a simulação selecionada destacada e paginação.
 */
export function SimulacoesTable({ pagina, selecionada, onSelect, onPage }: SimulacoesTableProps) {
  const { itens, total, total_paginas: totalPaginas } = pagina
  const atual = pagina.pagina

  return (
    <Panel
      title="Minhas simulações"
      description="Selecione uma simulação para ver as respostas, os grupos e o Índice de Aderência (IA): quanto a distro atende às suas respostas, não é chance de sucesso."
    >
      {itens.length === 0 ? (
        <p className="rounded-md border border-dashed border-line p-6 text-center text-body text-fg-muted">
          Esta página não tem simulações.
        </p>
      ) : (
        <>
          {/* Desktop: tabela */}
          <div className="max-lg:hidden">
            <table className="w-full border-collapse text-left text-label">
              <thead>
                <tr className="bg-chip text-small font-semibold text-fg-muted">
                  <th scope="col" className="px-2.5 py-2">Data</th>
                  <th scope="col" className="px-2.5 py-2">Perfil</th>
                  <th scope="col" className="px-2.5 py-2">1º grupo (IA)</th>
                  <th scope="col" className="px-2.5 py-2">Maior IA</th>
                  <th scope="col" className="px-2.5 py-2 text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((s) => {
                  const ativa = s.id === selecionada
                  return (
                    <tr
                      key={s.id}
                      aria-current={ativa || undefined}
                      onClick={() => onSelect(s.id)}
                      className={`cursor-pointer border-b border-line transition last:border-b-0 ${
                        ativa ? 'bg-highlight outline-1 -outline-offset-1 outline-primary-soft-border' : 'hover:bg-chip'
                      }`}
                    >
                      <td className={`px-2.5 py-3 whitespace-nowrap text-fg ${ativa ? 'font-semibold' : ''}`}>
                        {formatData(s.data)}
                      </td>
                      <td className="px-2.5 py-3 text-fg">{s.perfil}</td>
                      <td className="px-2.5 py-3 text-fg">{primeiroGrupo(s)}</td>
                      <td className="px-2.5 py-3 text-fg">{maiorIa(s)}</td>
                      <td className="px-2.5 py-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onSelect(s.id)
                          }}
                          aria-label={`Ver simulação de ${formatData(s.data)}`}
                          className="rounded-sm font-semibold text-accent hover:underline focus-visible:outline-2 focus-visible:outline-accent"
                        >
                          {ativa ? 'Selecionada' : 'Ver'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile: cards */}
          <ul className="flex flex-col gap-2 lg:hidden">
            {itens.map((s) => {
              const ativa = s.id === selecionada
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    aria-current={ativa || undefined}
                    onClick={() => onSelect(s.id)}
                    className={`flex w-full flex-col gap-1 rounded-md border p-3 text-left text-label transition focus-visible:outline-2 focus-visible:outline-accent ${
                      ativa ? 'border-primary-soft-border bg-highlight' : 'border-line hover:bg-chip'
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-fg">{formatData(s.data)}</span>
                      <span className="font-semibold text-accent">{ativa ? 'Selecionada' : 'Ver'}</span>
                    </span>
                    <span className="text-fg-muted">{s.perfil}</span>
                    <span className="text-fg">{primeiroGrupo(s)}</span>
                    <span className="text-fg-muted">Maior IA: {maiorIa(s)}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </>
      )}

      <nav aria-label="Paginação" className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-small text-fg-muted">
          {total} {total === 1 ? 'simulação' : 'simulações'} · página {atual} de {Math.max(totalPaginas, 1)}
        </p>
        {totalPaginas > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onPage(atual - 1)}
              disabled={atual <= 1}
              aria-label="Página anterior"
              className={`${PAGE_BUTTON} border-line text-fg-muted hover:bg-chip`}
            >
              <ChevronLeft aria-hidden className="size-4" />
            </button>
            {paginas(atual, totalPaginas).map((p, i) =>
              p === null ? (
                <span key={`gap-${i}`} aria-hidden className="px-1 text-small text-fg-subtle">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPage(p)}
                  aria-current={p === atual ? 'page' : undefined}
                  aria-label={`Página ${p}`}
                  className={`${PAGE_BUTTON} ${
                    p === atual
                      ? 'border-primary-soft-border bg-primary-soft text-chip-selected-fg'
                      : 'border-line text-fg-muted hover:bg-chip'
                  }`}
                >
                  {p}
                </button>
              ),
            )}
            <button
              type="button"
              onClick={() => onPage(atual + 1)}
              disabled={atual >= totalPaginas}
              aria-label="Próxima página"
              className={`${PAGE_BUTTON} border-line text-fg-muted hover:bg-chip`}
            >
              <ChevronRight aria-hidden className="size-4" />
            </button>
          </div>
        )}
      </nav>
    </Panel>
  )
}
