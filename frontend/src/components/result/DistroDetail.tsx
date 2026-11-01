import { CircleCheck, CircleDot, CircleMinus, CircleX, LoaderCircle, type LucideIcon } from 'lucide-react'
import type { Contribuicao, DistroOut, DistroResultado } from '../../api/types'
import { useDistro } from '../../hooks/useDistro'
import { formatDecimal, formatIaExata, formatNota } from '../../utils/format'
import { CRITERIO_LABEL, modeloLabel } from '../../utils/labels'
import { detailPanelId } from './detailToggle'
import { DistroAvisos } from './DistroRow'

type Estado = 'atende' | 'parcial' | 'nao_atende' | 'nao_respondido'

const ESTADOS: Record<Estado, { Icon: LucideIcon; label: string; legenda: string; icon: string; text: string }> = {
  atende: { Icon: CircleCheck, label: 'atende', legenda: 'atende: nota 1', icon: 'text-accent', text: 'text-fg' },
  parcial: { Icon: CircleDot, label: 'parcial', legenda: 'parcial: nota entre 0 e 1', icon: 'text-accent', text: 'text-fg' },
  nao_atende: { Icon: CircleX, label: 'não atende', legenda: 'não atende: nota 0', icon: 'text-danger', text: 'text-danger' },
  nao_respondido: {
    Icon: CircleMinus,
    label: 'não respondido',
    legenda: 'não respondido: não entra no cálculo',
    icon: 'text-fg-subtle',
    text: 'text-fg-subtle',
  },
}

function estadoDe(c: Contribuicao): Estado {
  if (!c.respondido || c.nota === null) return 'nao_respondido'
  if (c.nota >= 1) return 'atende'
  if (c.nota <= 0) return 'nao_atende'
  return 'parcial'
}

/** "atende · 1", "parcial · 0,75", "não atende · 0" ou "não respondido". */
function notaTexto(c: Contribuicao): string {
  const { label } = ESTADOS[estadoDe(c)]
  return c.nota === null || !c.respondido ? label : `${label} · ${formatNota(c.nota)}`
}

type DistroDetailProps = {
  distro: DistroResultado
  /** Peso dos critérios respondidos (`peso_respondido` do resultado). */
  pesoRespondido: number
  /** Nome do grupo, quando a distro está num grupo exibido; senão vem da ficha. */
  grupoNome?: string
  onClose: () => void
}

/**
 * Detalhamento da distro (Figma 118:59): IA exato, grupo, tabela peso × nota ×
 * contribuição, onde perdeu pontos, avisos e informações técnicas. Só exibe o
 * `DistroResultado` recebido (do what-if ou do snapshot salvo), sem recalcular.
 */
export function DistroDetail({ distro, pesoRespondido, grupoNome, onClose }: DistroDetailProps) {
  const ficha = useDistro(distro.id)
  const grupo = grupoNome ?? ficha.data?.grupo_nome
  // Só soma para exibir a linha de total; o IA mostrado é o da API.
  const somaContribuicoes = distro.contribuicoes.reduce((total, c) => total + c.contribuicao, 0)
  const pesoParcial = Math.abs(pesoRespondido - 1) > 1e-9

  return (
    <section
      id={detailPanelId(distro.id)}
      aria-label={`Detalhamento de ${distro.nome}`}
      className="flex flex-col gap-3 rounded-lg border border-line bg-card p-4"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
        <h3 className="flex-1 text-subheading font-semibold text-fg">{distro.nome}</h3>
        <p className="text-ia font-extrabold whitespace-nowrap text-accent">
          IA {formatIaExata(distro.ia)} · {distro.rotulo}
        </p>
      </div>

      <p className="text-label text-fg-muted">
        Grupo: {grupo ?? (ficha.loading ? 'carregando…' : 'não informado')}. IA = soma(peso × nota) ÷ soma dos
        pesos dos critérios respondidos. RAM, disco, arquitetura, ambiente e regra de tarefa já foram verificados na
        triagem.
      </p>
      <p className="text-label text-fg-muted">Quanto a distro atende às suas respostas, não é chance de sucesso.</p>

      <ul aria-label="Legenda" className="flex flex-wrap gap-x-4 gap-y-1.5">
        {Object.values(ESTADOS).map(({ Icon, legenda, icon }) => (
          <li key={legenda} className="flex items-center gap-1.5 text-label text-fg-muted">
            <Icon aria-hidden className={`size-4 shrink-0 ${icon}`} />
            {legenda}
          </li>
        ))}
      </ul>

      <div className="overflow-x-auto">
        <table className="w-full min-w-80 border-collapse text-label">
          <caption className="sr-only">Pontos por critério</caption>
          <thead>
            <tr className="text-fg-muted">
              <th scope="col" className="py-2 pr-2.5 text-left font-normal">
                Critério
              </th>
              <th scope="col" className="w-14 px-2.5 py-2 text-right font-normal lg:w-20">
                Peso
              </th>
              <th scope="col" className="px-2.5 py-2 text-right font-normal lg:w-36">
                Nota
              </th>
              <th scope="col" className="py-2 pl-2.5 text-right font-normal lg:w-48">
                <span className="lg:hidden">Contrib.</span>
                <span className="hidden lg:inline">Contribuição (peso × nota)</span>
              </th>
            </tr>
          </thead>
          <tbody className="font-semibold">
            {distro.contribuicoes.map((c) => {
              const { Icon, icon, text } = ESTADOS[estadoDe(c)]
              const muted = !c.respondido
              return (
                <tr key={c.criterio} className={`border-t border-line ${muted ? 'opacity-70' : ''}`}>
                  <th scope="row" className="py-2 pr-2.5 text-left font-semibold text-fg">
                    <span className="flex items-center gap-2">
                      <Icon aria-hidden className={`size-4 shrink-0 ${icon}`} />
                      {CRITERIO_LABEL[c.criterio]}
                    </span>
                  </th>
                  <td className={`px-2.5 py-2 text-right ${text}`}>{formatDecimal(c.peso, 3)}</td>
                  <td className={`px-2.5 py-2 text-right whitespace-nowrap ${text}`}>{notaTexto(c)}</td>
                  <td className={`py-2 pl-2.5 text-right ${text}`}>{formatDecimal(c.contribuicao, 3)}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot className="font-semibold">
            <tr className="border-t border-line">
              <th scope="row" className="py-2 pr-2.5 text-left font-semibold text-fg">
                Total (IA)
              </th>
              <td className="px-2.5 py-2 text-right text-fg">{formatDecimal(pesoRespondido, 3)}</td>
              <td className="px-2.5 py-2" />
              <td className="py-2 pl-2.5 text-right text-accent">
                {formatDecimal(somaContribuicoes, 3)}
                {pesoParcial && ` ÷ ${formatDecimal(pesoRespondido, 3)}`} = {formatIaExata(distro.ia)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="text-label text-fg-muted">
        <span className="font-semibold text-fg">Onde perdeu pontos: </span>
        {distro.perdeu_pontos.length > 0
          ? distro.perdeu_pontos.join(' · ')
          : 'Não perdeu pontos nos critérios respondidos.'}
      </p>

      {distro.avisos.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-label font-semibold text-fg">Avisos</p>
          <DistroAvisos avisos={distro.avisos} />
        </div>
      )}

      <InfoTecnica ficha={ficha.data} loading={ficha.loading} error={ficha.error} onRetry={ficha.retry} />

      <button
        type="button"
        onClick={onClose}
        className="self-start rounded-xs text-label font-semibold text-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        Ocultar detalhamento
      </button>
    </section>
  )
}

function lista(valores: string[]): string {
  return valores.length > 0 ? valores.join(', ') : 'não informado'
}

/** Comparação de texto da ficha: strip + casefold. */
function norm(valor: string): string {
  return valor.trim().toLowerCase()
}

/** Desktops da ficha, com o padrão marcado; sem padrão: "sem padrão, escolha livre". */
function desktopsTexto(ficha: DistroOut): string {
  const padroes = ficha.desktop_padrao.map(norm)
  const semPadrao = padroes.length === 0 || padroes.every((p) => p.startsWith('nenhum'))
  const desktops = ficha.desktops.map((d) => (!semPadrao && padroes.includes(norm(d)) ? `${d} (padrão)` : d))
  return semPadrao ? `${lista(desktops)} · sem padrão, escolha livre` : lista(desktops)
}

type InfoTecnicaProps = {
  ficha: DistroOut | null
  loading: boolean
  error: string | null
  onRetry: () => void
}

/** Informações técnicas, sem peso (GET /distros/{id}). */
function InfoTecnica({ ficha, loading, error, onRetry }: InfoTecnicaProps) {
  const titulo = <span className="font-semibold text-fg">Informações técnicas, sem peso: </span>

  if (loading) {
    return (
      <p role="status" className="flex items-center gap-2 text-label text-fg-muted">
        <LoaderCircle aria-hidden className="size-4 animate-spin" />
        Carregando informações técnicas…
      </p>
    )
  }
  if (error || !ficha) {
    return (
      <p role="alert" className="flex flex-wrap items-center gap-2 text-label text-danger">
        {error ?? 'Não foi possível carregar as informações técnicas.'}
        <button type="button" onClick={onRetry} className="font-semibold text-accent hover:underline">
          Tentar novamente
        </button>
      </p>
    )
  }
  return (
    <p className="text-label text-fg-muted">
      {titulo}
      Pacotes: {lista(ficha.gerenciador_pacotes)} · Init: {lista(ficha.init)} · Modelo:{' '}
      {lista(ficha.modelo_lancamento.map(modeloLabel))} · Ambientes gráficos: {desktopsTexto(ficha)}.
    </p>
  )
}
