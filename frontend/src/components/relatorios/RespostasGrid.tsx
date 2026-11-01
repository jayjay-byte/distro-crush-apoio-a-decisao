import type { Respostas } from '../../api/types'
import { respostasLabels } from '../../utils/labels'
import { Panel } from '../ui/Panel'

/** "Todas as respostas" (Figma 10:23437): as 10 respostas com os rótulos da tela. */
export function RespostasGrid({ respostas }: { respostas: Respostas }) {
  return (
    <Panel title="Todas as respostas" description="As mesmas 10 respostas do módulo de simulação.">
      <dl className="grid grid-cols-2 gap-x-6 lg:grid-cols-3">
        {respostasLabels(respostas).map(({ label, valor }) => (
          <div key={label} className="flex min-w-0 flex-col gap-0.5 border-b border-line py-2.5">
            <dt className="text-small text-fg-muted">{label}</dt>
            <dd className="text-body font-semibold break-words text-fg">{valor}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  )
}
