import { Check } from 'lucide-react'

export type Etapa = { label: string; concluida: boolean }

/** Painel de etapas (Figma 10:22790): Perfil, Hardware, Preferências e Resultado. */
export function StepsProgress({ etapas, resumo }: { etapas: Etapa[]; resumo: string }) {
  const concluidas = etapas.filter((e) => e.concluida).length
  return (
    <section aria-label="Etapas da simulação" className="flex flex-col gap-4 rounded-lg border border-line bg-card p-4">
      <ol className="grid grid-cols-2 gap-3 sm:flex sm:gap-5">
        {etapas.map(({ label, concluida }, index) => (
          <li key={label} className="flex min-w-0 flex-1 items-center gap-2">
            <span
              className={`flex size-6 shrink-0 items-center justify-center rounded-full text-small font-semibold ${
                concluida ? 'bg-primary text-on-primary' : 'border border-line bg-chip text-fg-muted'
              }`}
            >
              {concluida ? <Check aria-hidden className="size-3.5" /> : index + 1}
            </span>
            <span
              className={`truncate text-label font-semibold ${concluida ? 'text-chip-selected-fg' : 'text-fg-muted'}`}
            >
              {label}
              <span className="sr-only">{concluida ? ' (concluída)' : ' (pendente)'}</span>
            </span>
          </li>
        ))}
      </ol>
      <div aria-hidden className="h-1 overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-primary transition-[width]"
          style={{ width: `${(concluidas / etapas.length) * 100}%` }}
        />
      </div>
      <p className="text-small text-fg-muted">{resumo}</p>
    </section>
  )
}
