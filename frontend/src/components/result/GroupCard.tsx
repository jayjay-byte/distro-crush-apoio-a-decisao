import type { GrupoResultado } from '../../api/types'
import { formatPercent } from '../../utils/format'
import { Panel } from '../ui/Panel'
import type { DetailToggle } from './detailToggle'
import { DistroList } from './DistroRow'
import { IaBar } from './IaBar'
import { RotuloBadge } from './RotuloBadge'

type GroupCardProps = DetailToggle & {
  grupo: GrupoResultado
  /** Destaque visual (o 1º grupo, como no Figma 149:69). */
  highlight?: boolean
  className?: string
}

/** Card de grupo: "1º · Nome", IA do grupo (% + rótulo), barra e distros do grupo. */
export function GroupCard({ grupo, highlight = false, className = '', ...toggle }: GroupCardProps) {
  return (
    <Panel highlight={highlight} gap="gap-3" className={className}>
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
        <h3 className="flex-1 text-subheading font-semibold text-fg">
          {grupo.posicao}º · {grupo.nome}
        </h3>
        <p className="flex items-center gap-2">
          <span className="text-label text-fg-muted">IA do grupo</span>
          <span className="text-ia font-extrabold text-accent">{formatPercent(grupo.ia)}</span>
          <RotuloBadge rotulo={grupo.rotulo} />
        </p>
      </div>
      <IaBar ia={grupo.ia} size="grupo" />
      <DistroList distros={grupo.distros} {...toggle} />
    </Panel>
  )
}
