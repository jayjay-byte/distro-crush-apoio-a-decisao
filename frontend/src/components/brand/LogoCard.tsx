import { Logo } from './Logo'

type LogoCardSize = 'sm' | 'md' | 'lg'

// sm: barra lateral (13:1809) · md: Login mobile (27:41) · lg: Login desktop (27:34)
const SIZES: Record<LogoCardSize, { card: string; logo: 'md' | 'lg' }> = {
  sm: { card: 'rounded-logo-sm px-3.5 py-2.5', logo: 'md' },
  md: { card: 'rounded-logo-md px-4.5 py-2', logo: 'md' },
  lg: { card: 'rounded-logo-lg px-7 py-4', logo: 'lg' },
}

export function LogoCard({ size = 'sm', className = '' }: { size?: LogoCardSize; className?: string }) {
  const s = SIZES[size]
  return (
    <div
      role="img"
      aria-label="Distro Crush"
      className={`inline-flex w-fit items-center border-2 border-brand-card-border bg-brand-card shadow-logo ${s.card} ${className}`}
    >
      <Logo size={s.logo} />
    </div>
  )
}
