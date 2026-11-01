/** Controle do detalhamento: um painel aberto por vez no resultado. */
export type DetailToggle = {
  /** Id da distro com o detalhamento aberto. */
  aberta: string | null
  onToggle: (distroId: string) => void
}

/** Id do painel de detalhamento, para `aria-controls`. */
export function detailPanelId(distroId: string): string {
  return `detalhamento-${distroId}`
}
