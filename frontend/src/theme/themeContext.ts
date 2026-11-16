import { createContext, useContext } from 'react'

export type Theme = 'claro' | 'escuro'

export type ThemeContextValue = {
  theme: Theme
  toggleTheme: () => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext)
  if (!value) throw new Error('useTheme deve ser usado dentro de ThemeProvider')
  return value
}
