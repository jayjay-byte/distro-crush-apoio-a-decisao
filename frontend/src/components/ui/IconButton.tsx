import type { LucideIcon } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  icon: LucideIcon
  /** Texto para leitores de tela (obrigatório: o botão só tem ícone). */
  label: string
}

/** Botão quadrado de 32px com borda, como o "Alternar tema" do Figma. */
export function IconButton({ icon: Icon, label, className = '', type = 'button', ...props }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`inline-flex size-icon-button shrink-0 items-center justify-center rounded-lg border border-line bg-card text-fg transition hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${className}`}
      {...props}
    >
      <Icon aria-hidden className="size-4" />
    </button>
  )
}
