import { ChartNoAxesCombined, Cpu, Layers, UserRound } from 'lucide-react'

const STEPS = [
  { icon: UserRound, label: 'Seu perfil' },
  { icon: Cpu, label: 'Seu hardware' },
  { icon: Layers, label: 'Sua escolha' },
]

// Valor ilustrativo do Figma (10:22134), não vem da API.
const EXAMPLE_PERCENT = 96

/** "Do seu perfil à sua decisão": prévia estática do painel de Login no desktop (10:22120). */
export function AnalysisPreview({ className = '' }: { className?: string }) {
  return (
    <div className={`flex-col gap-5 rounded-lg border border-hero-glass-border bg-hero-glass p-6 ${className}`}>
      <div className="flex items-start justify-between">
        <p className="text-body font-semibold">Do seu perfil à sua decisão</p>
        <ChartNoAxesCombined aria-hidden className="size-4.5 text-hero-eyebrow" />
      </div>

      <ul className="flex gap-2">
        {STEPS.map(({ icon: Icon, label }) => (
          <li key={label} className="flex flex-1 flex-col gap-2.5 rounded-md bg-hero-glass p-3">
            <Icon aria-hidden className="size-5.5 text-hero-eyebrow" />
            <span className="text-label">{label}</span>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-2">
        <div className="flex items-start">
          <span className="flex-1 text-label text-hero-soft">Aderência ao perfil (exemplo)</span>
          <span className="text-lead font-extrabold">{EXAMPLE_PERCENT}%</span>
        </div>
        <div className="h-1.75 overflow-hidden rounded-md bg-hero-glass-border">
          <div className="h-full rounded-md bg-hero-eyebrow" style={{ width: `${EXAMPLE_PERCENT}%` }} />
        </div>
      </div>

      <p className="text-caption text-hero-eyebrow">Simulação ilustrativa · Grupo A, desktop acessível</p>
    </div>
  )
}
