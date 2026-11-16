import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../theme/themeContext'
import { IconButton } from '../ui/IconButton'

/** Lua no tema claro (ativa o escuro) e sol no escuro (ativa o claro), como no Figma. */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()
  const dark = theme === 'escuro'
  return (
    <IconButton
      icon={dark ? Sun : Moon}
      label={dark ? 'Ativar tema claro' : 'Ativar tema escuro'}
      onClick={toggleTheme}
      className={className}
    />
  )
}
