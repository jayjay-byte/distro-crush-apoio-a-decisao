import type { CSSProperties } from 'react'
import { formatGb, parseDecimal } from '../../utils/format'

type RangeNumberFieldProps = {
  id: string
  label: string
  /** Texto digitado (mantido como texto para aceitar vírgula e mostrar erros). */
  value: string
  onChange: (text: string) => void
  min: number
  max: number
  step: number
  /** Rótulos dos limites do slider (ex.: "512 MB", "64 GB"). */
  minLabel: string
  maxLabel: string
  unit: string
  hint?: string
  error?: string
}

/**
 * Slider do Figma (10:22884) + campo numérico no lugar do chip de valor.
 * O campo aceita valores fora da faixa (ex.: RAM abaixo de 512 MB em hardware
 * antigo); nesse caso a alça fica no limite e aparece uma dica abaixo do slider.
 */
export function RangeNumberField({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step,
  minLabel,
  maxLabel,
  unit,
  hint,
  error,
}: RangeNumberFieldProps) {
  const parsed = parseDecimal(value)
  const sliderValue = Math.min(Math.max(parsed ?? min, min), max)
  const fill = ((sliderValue - min) / (max - min)) * 100
  // Com erro, a mensagem de erro basta; a dica só vale para valores aceitos.
  const foraDaFaixa = !error && parsed !== null && (parsed < min || parsed > max)
  const hintId = `${id}-dica`
  const errorId = `${id}-erro`
  const rangeId = `${id}-faixa`
  const describedBy =
    [foraDaFaixa && rangeId, hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3">
      <div className="flex items-center gap-3">
        <label htmlFor={id} className="flex-1 text-body font-semibold text-fg">
          {label}
        </label>
        <div
          className={`flex items-center gap-1 rounded-md border px-2.5 py-1 transition focus-within:border-accent ${
            error ? 'border-danger-border bg-danger-soft' : 'border-primary-soft-border bg-primary-soft'
          }`}
        >
          <input
            id={id}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className="w-14 bg-transparent text-right text-label font-semibold text-chip-selected-fg outline-none"
          />
          <span className="text-label font-semibold text-chip-selected-fg">{unit}</span>
        </div>
      </div>

      <input
        type="range"
        aria-label={`${label} (controle deslizante)`}
        min={min}
        max={max}
        step={step}
        value={sliderValue}
        onChange={(e) => onChange(formatGb(Number(e.target.value)))}
        style={{ '--fill': `${fill}%` } as CSSProperties}
        className="h-5 w-full cursor-pointer appearance-none bg-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [&::-moz-range-progress]:h-1.25 [&::-moz-range-progress]:rounded-full [&::-moz-range-progress]:bg-bar [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-bar [&::-moz-range-thumb]:bg-card [&::-moz-range-track]:h-1.25 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-line [&::-webkit-slider-runnable-track]:h-1.25 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-[linear-gradient(to_right,var(--color-bar)_var(--fill),var(--color-line)_var(--fill))] [&::-webkit-slider-thumb]:-mt-1.25 [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-bar [&::-webkit-slider-thumb]:bg-card"
      />

      <div className="flex justify-between text-small text-fg-muted">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>

      {foraDaFaixa && (
        <p id={rangeId} className="text-small font-semibold text-accent">
          Valor fora da faixa do controle
        </p>
      )}

      {error && (
        <p id={errorId} className="text-small font-semibold text-danger">
          {error}
        </p>
      )}
      {hint && (
        <p id={hintId} className="text-small text-fg-muted">
          {hint}
        </p>
      )}
    </div>
  )
}
