import { useNavigate } from 'react-router'
import type { UltimaSimulacao } from '../../api/types'
import { formatData, formatGb, formatPercent } from '../../utils/format'
import { IaBar } from '../result/IaBar'
import { Button } from '../ui/Button'
import { Chip } from '../ui/Chip'

/** Link de Relatórios com a simulação já selecionada. */
function relatorioUrl(id: number): string {
  return `/relatorios?simulacao=${id}`
}

/**
 * "Última simulação" (Figma 51:567): data, perfil, RAM, 1º grupo com as distros
 * e IA do grupo, distro de maior IA e "Ver relatório".
 */
export function UltimaSimulacaoCard({ ultima }: { ultima: UltimaSimulacao }) {
  const navigate = useNavigate()
  const grupo = ultima.primeiro_grupo
  const maior = ultima.distro_maior_ia

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-line bg-card p-4 lg:p-5">
      <div className="flex flex-col gap-0.75">
        <h2 className="text-heading font-semibold text-fg">Última simulação</h2>
        <p className="text-label text-fg-muted">
          {formatData(ultima.data)} · {ultima.perfil} · {formatGb(ultima.ram_gb)} GB RAM
        </p>
      </div>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:gap-8">
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <p className="text-label font-semibold text-fg-muted">
            {grupo ? `1º grupo: ${grupo.nome}` : 'Nenhum grupo exibido nesta simulação'}
          </p>
          {grupo && (
            <ul className="flex flex-wrap gap-1.5" aria-label={`Distros do grupo ${grupo.nome}`}>
              {grupo.distros.map((d) => (
                <li key={d.id}>
                  <Chip>
                    {d.nome} · {formatPercent(d.ia)}
                  </Chip>
                </li>
              ))}
            </ul>
          )}
          {maior && (
            <p className="text-small text-fg-muted">
              Distro de maior IA: {maior.nome} · {formatPercent(maior.ia)} ({maior.rotulo})
            </p>
          )}
        </div>

        {grupo && (
          <div className="flex flex-col gap-0.5">
            <p className="text-metric font-extrabold text-fg">{formatPercent(grupo.ia)}</p>
            <IaBar ia={grupo.ia} size="grupo" className="w-30" />
            <p className="text-small whitespace-nowrap text-fg-muted">IA do grupo · {grupo.rotulo}</p>
          </div>
        )}

        <Button variant="secondary" onClick={() => navigate(relatorioUrl(ultima.id))} className="max-lg:w-full">
          Ver relatório
        </Button>
      </div>
    </section>
  )
}
