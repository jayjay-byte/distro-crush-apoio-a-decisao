import { ChevronDown, TriangleAlert } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import type { DistroResultado, Resultado } from '../../api/types'
import { Alert } from '../ui/Alert'
import { DistroDetail } from './DistroDetail'
import { DistroListCard } from './DistroListCard'
import { GroupCard } from './GroupCard'

/** Grupos sempre visíveis no mobile; os demais ficam atrás de "Ver mais grupos". */
const GRUPOS_MOBILE = 3

/**
 * Corpo do resultado, na ordem da especificação: destaques → grupos → também
 * compatíveis → avisos. Um detalhamento aberto por vez, logo abaixo do card que
 * contém a distro. Só exibe o `Resultado` recebido (what-if ou snapshot salvo);
 * para começar com tudo fechado num resultado novo, troque a `key`.
 */
export function ResultView({ resultado }: { resultado: Resultado }) {
  const [aberta, setAberta] = useState<string | null>(null)
  const [todosGrupos, setTodosGrupos] = useState(false)

  const toggle = { aberta, onToggle: (id: string) => setAberta((atual) => (atual === id ? null : id)) }

  /** Painel de detalhamento, se a distro aberta estiver nesta lista. */
  function detalhe(distros: DistroResultado[], grupoNome?: string): ReactNode {
    const distro = distros.find((d) => d.id === aberta)
    if (!distro) return null
    return (
      <DistroDetail
        distro={distro}
        grupoNome={grupoNome}
        pesoRespondido={resultado.peso_respondido}
        onClose={() => setAberta(null)}
      />
    )
  }

  const ocultos = resultado.grupos.length - GRUPOS_MOBILE

  return (
    <div className="flex flex-col gap-3">
      {resultado.destaques.length > 0 && (
        <>
          <DistroListCard
            title={resultado.destaques.length === 1 ? 'Destaque fora dos grupos' : 'Destaques fora dos grupos'}
            description={
              resultado.grupos.length > 0
                ? 'Única compatível do seu grupo e com IA acima do 1º grupo.'
                : 'Nenhum grupo tem duas ou mais distros compatíveis, então elas aparecem fora dos grupos.'
            }
            distros={resultado.destaques}
            highlight
            {...toggle}
          />
          {detalhe(resultado.destaques)}
        </>
      )}

      {resultado.grupos.map((grupo, index) => {
        const escondido = !todosGrupos && index >= GRUPOS_MOBILE ? 'max-lg:hidden' : ''
        return (
          <div key={grupo.nome} className={`flex flex-col gap-3 ${escondido}`}>
            <GroupCard grupo={grupo} highlight={index === 0} {...toggle} />
            {detalhe(grupo.distros, grupo.nome)}
          </div>
        )
      })}

      {!todosGrupos && ocultos > 0 && (
        <button
          type="button"
          onClick={() => setTodosGrupos(true)}
          className="inline-flex items-center justify-center gap-1.5 self-center rounded-md px-3 py-2 text-label font-semibold text-accent hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-accent lg:hidden"
        >
          Ver mais grupos ({ocultos})
          <ChevronDown aria-hidden className="size-4" />
        </button>
      )}

      {resultado.tambem_compativeis.length > 0 && (
        <>
          <DistroListCard
            title="Também compatíveis"
            description="Distros sem outra compatível no mesmo grupo e com IA abaixo do 1º grupo."
            distros={resultado.tambem_compativeis}
            {...toggle}
          />
          {detalhe(resultado.tambem_compativeis)}
        </>
      )}

      {resultado.avisos.length > 0 && (
        <Alert icon={TriangleAlert} title="Avisos">
          <ul className="flex flex-col gap-0.5">
            {resultado.avisos.map((aviso) => (
              <li key={aviso}>{aviso}</li>
            ))}
          </ul>
        </Alert>
      )}
    </div>
  )
}
