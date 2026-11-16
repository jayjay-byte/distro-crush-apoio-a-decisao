import logoIcon from '../../assets/logo-icon.svg'

type LogoSize = 'md' | 'lg'

// Proporções do Figma (frames 18:40 e 18:34): ícone com a altura do logo e
// palavra "DistroCrush" ao lado.
const SIZES: Record<LogoSize, { icon: string; text: string; gap: string }> = {
  md: { icon: 'size-logo-md', text: 'text-logo-md', gap: 'gap-1.5' },
  lg: { icon: 'size-logo-lg', text: 'text-logo-lg', gap: 'gap-2.5' },
}

export function LogoIcon({ className = 'size-logo-sm' }: { className?: string }) {
  return <img src={logoIcon} alt="" className={`block shrink-0 ${className}`} />
}

export function Logo({ size = 'md' }: { size?: LogoSize }) {
  const s = SIZES[size]
  return (
    <span className={`inline-flex items-center ${s.gap}`}>
      <LogoIcon className={s.icon} />
      <span className={`font-extrabold whitespace-nowrap text-brand-ink ${s.text}`}>
        Distro<span className="text-brand-accent">Crush</span>
      </span>
    </span>
  )
}
