import type { ReactNode } from 'react'

export const FUTURE_FEATURE_HINT = 'Disponível em versão futura'

/**
 * Envolve controles que no piloto ficam só no visual. O controle interno deve
 * vir `disabled`; a dica fica no invólucro porque elementos desabilitados não
 * mostram `title` em todos os navegadores.
 */
export function FutureFeature({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span title={FUTURE_FEATURE_HINT} className={`inline-flex cursor-not-allowed ${className}`}>
      {children}
    </span>
  )
}
