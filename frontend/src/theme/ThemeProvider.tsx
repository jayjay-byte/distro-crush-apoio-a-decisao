import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ThemeContext, type Theme } from './themeContext'

// Mesma chave do script inline de index.html.
const STORAGE_KEY = 'distro-crush:tema'
const DARK_QUERY = '(prefers-color-scheme: dark)'

function readSaved(): Theme | null {
  const saved = localStorage.getItem(STORAGE_KEY)
  return saved === 'claro' || saved === 'escuro' ? saved : null
}

function systemTheme(): Theme {
  return window.matchMedia(DARK_QUERY).matches ? 'escuro' : 'claro'
}

/** Tema claro/escuro: a escolha fica no localStorage; sem escolha, segue o SO. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<Theme | null>(readSaved)
  const [system, setSystem] = useState<Theme>(systemTheme)
  const theme = saved ?? system

  // Acompanha o SO enquanto o usuário não escolher um tema.
  useEffect(() => {
    const media = window.matchMedia(DARK_QUERY)
    const onChange = () => setSystem(media.matches ? 'escuro' : 'claro')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'escuro')
  }, [theme])

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === 'escuro' ? 'claro' : 'escuro'
    localStorage.setItem(STORAGE_KEY, next)
    setSaved(next)
  }, [theme])

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
