type IaBarProps = {
  /** IA de 0 a 1, como vem da API. */
  ia: number
  /** `grupo`: 8px (cabeçalho do grupo); `distro`: 6px (linha da distro). */
  size?: 'grupo' | 'distro'
  className?: string
}

/** Barra de IA (Figma 149:104 / 149:115). Decorativa: o % aparece em texto ao lado. */
export function IaBar({ ia, size = 'distro', className = '' }: IaBarProps) {
  const height = size === 'grupo' ? 'h-2 rounded-sm' : 'h-1.5 rounded-xs'
  const width = `${Math.min(Math.max(ia, 0), 1) * 100}%`
  return (
    <div aria-hidden className={`overflow-hidden bg-line ${height} ${className}`}>
      <div className={`h-full bg-bar ${height}`} style={{ width }} />
    </div>
  )
}
