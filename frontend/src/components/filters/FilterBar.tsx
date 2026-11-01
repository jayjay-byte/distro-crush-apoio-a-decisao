import { CalendarDays, FilterX } from 'lucide-react'
import { Button } from '../ui/Button'
import { Chip } from '../ui/Chip'
import { FutureFeature } from '../ui/FutureFeature'
import { SelectField } from '../ui/SelectField'
import { TextField } from '../ui/TextField'

type FilterBarProps = {
  /** Selects além do período (ex.: "Propósito" → "Todos os propósitos"). */
  selects: { label: string; placeholder: string }[]
  /** Texto ao lado dos chips (ex.: "6 simulações suas"). */
  resumo?: string
}

/**
 * Filtros do Dashboard e de Relatórios (Figma 51:392 / 10:23346). No piloto ficam
 * só no visual: todos desabilitados, com a dica "Disponível em versão futura".
 */
export function FilterBar({ selects, resumo }: FilterBarProps) {
  return (
    <section aria-label="Filtros" className="flex flex-col gap-4 rounded-lg border border-line bg-card p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <FutureFeature className="min-w-0 flex-1">
          <TextField
            label="Período"
            value="Todo o período"
            readOnly
            disabled
            className="opacity-50"
            trailing={<CalendarDays aria-hidden className="size-4" />}
          />
        </FutureFeature>
        {selects.map((s) => (
          <FutureFeature key={s.label} className="min-w-0 flex-1">
            <SelectField label={s.label} options={[{ value: '', label: s.placeholder }]} disabled />
          </FutureFeature>
        ))}
        <FutureFeature className="self-start lg:self-auto">
          <Button variant="secondary" icon={FilterX} disabled>
            Limpar
          </Button>
        </FutureFeature>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <FutureFeature>
          <Chip>Todo o período</Chip>
        </FutureFeature>
        {resumo && <p className="text-small text-fg-muted">{resumo}</p>}
      </div>
    </section>
  )
}
