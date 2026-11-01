import type { DistroResultado } from '../../api/types'
import { Panel } from '../ui/Panel'
import type { DetailToggle } from './detailToggle'
import { DistroList } from './DistroRow'

type DistroListCardProps = DetailToggle & {
  title: string
  description?: string
  distros: DistroResultado[]
  highlight?: boolean
}

/** Card de distros fora dos grupos exibidos: destaques e "também compatíveis". */
export function DistroListCard({ title, description, distros, highlight = false, ...toggle }: DistroListCardProps) {
  return (
    <Panel title={title} description={description} highlight={highlight} gap="gap-3">
      <DistroList distros={distros} {...toggle} />
    </Panel>
  )
}
