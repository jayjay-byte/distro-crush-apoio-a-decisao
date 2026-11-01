import type { ReactNode } from 'react'
import type { Resultado } from '../../api/types'

/** "Linux Mint", "Linux Mint e antiX", "A, B e C". */
function juntarNomes(nomes: string[]): string {
  if (nomes.length <= 1) return nomes.join('')
  return `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}`
}

function plural(n: number, singular: string, pluralForm: string): string {
  return `${n} ${n === 1 ? singular : pluralForm}`
}

type ResultHeaderProps = {
  resultado: Resultado
  /** Sobretítulo (ex.: "04 · RESULTADO"). */
  eyebrow?: string
  /** Ações à direita do título (ex.: Salvar). */
  actions?: ReactNode
}

/**
 * Título do resultado (Figma 10:22964):
 * - sem destaque: "Seu perfil combina mais com: <1º grupo>";
 * - com destaque: "Destaque para o seu perfil: <distro>" + "Grupo mais aderente: <1º grupo>";
 * - sem grupos: "Distros compatíveis".
 */
export function ResultHeader({ resultado, eyebrow, actions }: ResultHeaderProps) {
  const primeiro = resultado.grupos[0]
  const destaques = juntarNomes(resultado.destaques.map((d) => d.nome))

  let titulo: string
  if (resultado.compativeis === 0) titulo = 'Nenhuma distro compatível'
  else if (!primeiro) titulo = 'Distros compatíveis'
  else if (destaques) titulo = `Destaque para o seu perfil: ${destaques}`
  else titulo = `Seu perfil combina mais com: ${primeiro.nome}`

  const contagem = primeiro
    ? `${plural(resultado.compativeis, 'distro compatível', 'distros compatíveis')} em ${plural(
        resultado.grupos.length,
        'grupo',
        'grupos',
      )}, ordenados pelo Índice de Aderência (IA) do grupo.`
    : `${plural(resultado.compativeis, 'distro compatível', 'distros compatíveis')}.`

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="flex flex-1 flex-col gap-1">
        {eyebrow && <p className="text-small font-semibold text-accent">{eyebrow}</p>}
        <h2 className="text-title font-extrabold break-words text-fg">{titulo}</h2>
        {primeiro && destaques && (
          <p className="text-lead font-semibold text-fg">Grupo mais aderente: {primeiro.nome}</p>
        )}
        <p className="text-body text-fg-muted">
          {resultado.compativeis > 0 && `${contagem} `}Quanto a distro atende às suas respostas, não é chance de
          sucesso.
        </p>
      </div>
      {actions}
    </div>
  )
}
