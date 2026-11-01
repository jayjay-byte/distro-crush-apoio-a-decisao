import { TriangleAlert } from 'lucide-react'
import type { DistroResultado } from '../../api/types'
import { formatPercent } from '../../utils/format'
import { detailPanelId, type DetailToggle } from './detailToggle'
import { IaBar } from './IaBar'
import { RotuloBadge } from './RotuloBadge'

/**
 * Linha de distro (Figma 149:107): nome, barra, % inteiro, rótulo e
 * "Ver detalhamento". Os avisos da distro aparecem logo abaixo, em chips.
 */
export function DistroRow({ distro, aberta, onToggle }: { distro: DistroResultado } & DetailToggle) {
  const expanded = aberta === distro.id
  return (
    <li className="flex flex-col gap-1.5 border-t border-line py-2">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-3 gap-y-1.5 lg:grid-cols-[150px_minmax(0,1fr)_40px_auto_auto]">
        <p className="order-1 text-body font-semibold break-words text-fg">{distro.nome}</p>
        <IaBar ia={distro.ia} className="order-4 col-span-full lg:order-2 lg:col-span-1" />
        <p className="order-2 text-right text-body font-semibold text-fg lg:order-3">{formatPercent(distro.ia)}</p>
        <RotuloBadge rotulo={distro.rotulo} className="order-3 lg:order-4" />
        <button
          type="button"
          onClick={() => onToggle(distro.id)}
          aria-expanded={expanded}
          aria-controls={expanded ? detailPanelId(distro.id) : undefined}
          className="order-5 col-span-full justify-self-start rounded-xs text-label text-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent lg:col-span-1"
        >
          {expanded ? 'Ocultar detalhamento' : 'Ver detalhamento'}
        </button>
      </div>
      {distro.avisos.length > 0 && <DistroAvisos avisos={distro.avisos} />}
    </li>
  )
}

/** Avisos de uma distro (requisito não informado, valor recomendado, sistema live...). */
export function DistroAvisos({ avisos }: { avisos: string[] }) {
  return (
    <ul aria-label="Avisos" className="flex flex-wrap gap-1.5">
      {avisos.map((aviso) => (
        <li
          key={aviso}
          className="inline-flex items-center gap-1 rounded-md border border-line bg-chip px-2 py-0.5 text-small text-fg-muted"
        >
          <TriangleAlert aria-hidden className="size-3 shrink-0" />
          {aviso}
        </li>
      ))}
    </ul>
  )
}

/** Lista de linhas de distro de um card. */
export function DistroList({ distros, ...toggle }: { distros: DistroResultado[] } & DetailToggle) {
  return (
    <ul className="flex flex-col">
      {distros.map((distro) => (
        <DistroRow key={distro.id} distro={distro} {...toggle} />
      ))}
    </ul>
  )
}
