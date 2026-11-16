import { useMatches } from 'react-router'

export type RouteHandle = { title: string }

/** Título da página atual, vindo do `handle` da rota em src/router.tsx. */
export function usePageTitle(): string {
  const matches = useMatches()
  for (let i = matches.length - 1; i >= 0; i--) {
    const handle = matches[i].handle as RouteHandle | undefined
    if (handle?.title) return handle.title
  }
  return ''
}
