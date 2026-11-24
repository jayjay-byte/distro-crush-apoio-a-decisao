import { CircleCheck } from 'lucide-react'
import type { Respostas, Resultado } from '../../api/types'
import { formatGb, formatPercent } from '../../utils/format'
import { AMBIENTE_LABEL, ARQUITETURA_LABEL, NIVEL_LABEL, TAREFA_LABEL } from '../../utils/labels'
import { Panel } from '../ui/Panel'

/** "Linux Mint", "Linux Mint e antiX", "A, B e C". */
function juntarNomes(nomes: string[]): string {
  if (nomes.length <= 1) return nomes.join('')
  return `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}`
}

function plural(n: number, singular: string, pluralForm: string): string {
  return `${n} ${n === 1 ? singular : pluralForm}`
}

/** "Linux Mint, com IA de 93% (Muito alta)". */
function comIa(nome: string, ia: number, rotulo: string): string {
  return `${nome}, com IA de ${formatPercent(ia)} (${rotulo})`
}

/**
 * Card 1: mesma regra do título do resultado (ResultHeader): com destaque, cita
 * primeiro a distro em destaque e depois o 1º grupo.
 */
function perfilEFacilidade(r: Resultado, respostas: Respostas): string {
  const nivel = `A usabilidade foi avaliada para o nível ${NIVEL_LABEL[respostas.nivel]}.`
  if (r.compativeis === 0) return 'Nenhuma distro passou na triagem.'
  const primeiro = r.grupos[0]
  if (!primeiro) {
    return `Nenhum grupo teve duas ou mais distros compatíveis; ${
      r.compativeis === 1 ? 'a distro compatível aparece' : `as ${r.compativeis} distros compatíveis aparecem`
    } fora dos grupos. ${nivel}`
  }
  const grupo = comIa(primeiro.nome, primeiro.ia, primeiro.rotulo)
  if (r.destaques.length > 0) {
    const destaques = juntarNomes(r.destaques.map((d) => comIa(d.nome, d.ia, d.rotulo)))
    return `Destaque para o seu perfil: ${destaques}, fora dos grupos. O grupo mais aderente é ${grupo}. ${nivel}`
  }
  return `O 1º grupo é ${grupo}. ${nivel}`
}

/** Card 2: o que a triagem (hardware, arquitetura, ambiente, tarefa) deixou passar. */
function hardwareEPreferencias(r: Resultado, respostas: Respostas): string {
  const hardware = `${formatGb(respostas.ram_gb)} GB de RAM, ${formatGb(respostas.disco_gb)} GB de armazenamento, ${
    ARQUITETURA_LABEL[respostas.arquitetura]
  } e ambiente ${AMBIENTE_LABEL[respostas.ambiente]}`
  const triagem =
    r.compativeis === 0
      ? `${hardware} não deixaram nenhuma distro compatível na triagem.`
      : `${hardware} deixaram ${plural(r.compativeis, 'distro compatível', 'distros compatíveis')} na triagem.`
  const tarefa = respostas.tarefa
    ? ` A tarefa ${TAREFA_LABEL[respostas.tarefa]} também filtra as distros de propósito específico.`
    : ''
  return `${triagem}${tarefa} As preferências (ajuda, atualizações, init e ambiente gráfico) só alteram o IA. ${pesosUsados(r)}`
}

/** Origem dos pesos, pelo snapshot (sem o campo = ROC). */
function pesosUsados(r: Resultado): string {
  return (r.pesos_origem ?? 'roc') === 'usuario'
    ? 'Esta simulação usou pesos personalizados: as notas de 0 a 10 que você deu a cada critério.'
    : 'Esta simulação usou os pesos sugeridos pelo método ROC.'
}

const LIMITES =
  'O IA mostra quanto a distro atende às suas respostas, não é chance de sucesso. Verifique cada versão antes da instalação.'

/** "Como interpretar este resultado" (Figma 10:23560): 3 textos-modelo com os dados do snapshot. */
export function InterpretacaoCards({ resultado, respostas }: { resultado: Resultado; respostas: Respostas }) {
  const cards = [
    { titulo: 'Perfil e facilidade', texto: perfilEFacilidade(resultado, respostas) },
    { titulo: 'Hardware e preferências', texto: hardwareEPreferencias(resultado, respostas) },
    { titulo: 'Limites da análise', texto: LIMITES },
  ]
  return (
    <Panel title="Como interpretar este resultado">
      <ul className="grid gap-4 lg:grid-cols-3">
        {cards.map((c) => (
          <li key={c.titulo} className="flex flex-col gap-1.5">
            <CircleCheck aria-hidden className="size-4 text-accent" />
            <p className="text-label font-semibold text-fg">{c.titulo}</p>
            <p className="text-label text-fg-muted">{c.texto}</p>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
