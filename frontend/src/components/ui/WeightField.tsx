import { useEffect, useRef, type KeyboardEvent } from 'react'

const MIN = 0
const MAX = 10

type WeightFieldProps = {
  id: string
  /** Nome do critério, para o leitor de tela ("Peso de Suporte, de 0 a 10"). */
  criterio: string
  /** Texto digitado: inteiro de 0 a 10 ou vazio enquanto digita. */
  value: string
  onChange: (text: string) => void
  /** Critério sem resposta ("Sem preferência") ou pesos ainda não carregados. */
  disabled?: boolean
  /** Dica no lugar da mensagem (ex.: "Não entra no cálculo"). */
  hint?: string
  error?: string
}

/**
 * Nota de importância de 0 a 10 ao lado de uma pergunta. Só aceita inteiros
 * (dígitos até 10); as setas do teclado sobem e descem a nota. Ao sair do
 * campo vazio, ele volta ao último valor válido daquele campo.
 */
export function WeightField({ id, criterio, value, onChange, disabled = false, hint, error }: WeightFieldProps) {
  const mensagemId = `${id}-msg`
  const mensagem = error ?? hint

  // Último valor válido (não vazio) mostrado no campo: o sugerido ou a última nota digitada.
  const ultimoValido = useRef(value)
  useEffect(() => {
    if (value !== '') ultimoValido.current = value
  }, [value])

  function handleChange(texto: string) {
    const digitos = texto.replace(/\D/g, '')
    if (digitos === '') return onChange('')
    const nota = Number(digitos)
    if (nota > MAX) return // mantém o valor anterior
    onChange(String(nota))
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
    event.preventDefault()
    const atual = value === '' ? MIN : Number(value)
    const proxima = Math.min(MAX, Math.max(MIN, atual + (event.key === 'ArrowUp' ? 1 : -1)))
    onChange(String(proxima))
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-1" title={disabled ? hint : undefined}>
      <div className={`flex items-center gap-1.5 ${disabled ? 'opacity-50' : ''}`}>
        <label htmlFor={id} className="text-small font-semibold text-fg-muted">
          Peso<span className="sr-only"> de {criterio}, de 0 a 10</span>
        </label>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={2}
          value={value}
          disabled={disabled}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => value === '' && ultimoValido.current !== '' && onChange(ultimoValido.current)}
          aria-invalid={error ? true : undefined}
          aria-describedby={mensagem ? mensagemId : undefined}
          className={`h-8 w-10 rounded-md border text-center text-label font-semibold text-chip-selected-fg transition outline-none focus:border-accent disabled:cursor-not-allowed ${
            error ? 'border-danger-border bg-danger-soft' : 'border-primary-soft-border bg-primary-soft'
          }`}
        />
        <span aria-hidden className="text-small text-fg-muted">
          /10
        </span>
      </div>
      {mensagem && (
        <p
          id={mensagemId}
          className={`text-right text-small ${error ? 'font-semibold text-danger' : 'text-fg-subtle'}`}
        >
          {mensagem}
        </p>
      )}
    </div>
  )
}
