import {
  BriefcaseBusiness,
  CircleMinus,
  Cloud,
  House,
  Monitor,
  RefreshCw,
  Server,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from 'lucide-react'
import type { ReactNode, SubmitEvent } from 'react'
import type { Ambiente, Arquitetura, Nivel, OpcoesOut, Tarefa } from '../../api/types'
import type { RequestState } from '../../hooks/useRequest'
import {
  AJUDA_LABEL,
  AMBIENTE_LABEL,
  ARQUITETURA_LABEL,
  ATUALIZACOES_LABEL,
  NIVEL_LABEL,
  SEM_PREFERENCIA,
  TAREFA_LABEL,
  USO_GERAL,
} from '../../utils/labels'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { OptionCard } from '../ui/OptionCard'
import { Panel } from '../ui/Panel'
import { RangeNumberField } from '../ui/RangeNumberField'
import { SelectField } from '../ui/SelectField'
import { ToggleChip } from '../ui/ToggleChip'
import { CAMPO_ID, toggleAjuda, type FormErrors, type FormState } from './formState'

const AMBIENTE_ICON = { desktop: Monitor, servidor: Server, nuvem: Cloud }

const NIVEL_DICA: Record<Nivel, string> = {
  iniciante: 'Iniciante: prefiro uma instalação guiada e uma interface familiar.',
  intermediario: 'Intermediário: já uso Linux e resolvo pequenos ajustes no terminal.',
  avancado: 'Avançado: configuro e mantenho o sistema por conta própria.',
}

function Pergunta({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-2.5">
      <legend className="mb-2.5 text-body font-semibold text-fg">
        {titulo}
      </legend>
      {children}
    </fieldset>
  )
}

type SimulacaoFormProps = {
  form: FormState
  onChange: (patch: Partial<FormState>) => void
  /** Erros já visíveis (os de RAM/disco aparecem ao digitar; o de tarefa, ao enviar). */
  errors: FormErrors
  opcoes: RequestState<OpcoesOut>
  onSubmit: () => void
  loading: boolean
  /** "10 respostas preenchidas · última análise em …". */
  rodape: string
}

/** Formulário das 10 perguntas (Figma 10:22810), em 3 painéis. */
export function SimulacaoForm({ form, onChange, errors, opcoes, onSubmit, loading, rodape }: SimulacaoFormProps) {
  const tarefaAtiva = form.proposito === 'tarefa_especifica'

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit()
  }

  const opcoesCarregando = opcoes.loading
  const selectOptions = (valores: string[] | undefined) => [
    { value: '', label: opcoesCarregando ? 'Carregando opções…' : SEM_PREFERENCIA },
    ...(valores ?? []).map((v) => ({ value: v, label: v })),
  ]

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Panel title="01 · Perfil de uso" description="O que você precisa e como prefere trabalhar.">
        <div className="grid gap-x-6 gap-y-5 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <Pergunta titulo="Qual é o propósito de uso?">
              <div className="flex flex-col gap-2 sm:flex-row">
                <OptionCard
                  type="radio"
                  name="proposito"
                  icon={House}
                  title={USO_GERAL}
                  description="Navegar, estudar e usar aplicativos."
                  checked={!tarefaAtiva}
                  onChange={() => onChange({ proposito: 'geral' })}
                />
                <OptionCard
                  type="radio"
                  name="proposito"
                  icon={Target}
                  title="Tarefa específica"
                  description="Jogos, segurança ou hardware antigo."
                  checked={tarefaAtiva}
                  onChange={() => onChange({ proposito: 'tarefa_especifica' })}
                />
              </div>
            </Pergunta>

            <fieldset
              disabled={!tarefaAtiva}
              aria-describedby="simulacao-tarefa-dica"
              className="flex min-w-0 flex-col gap-2"
            >
              <legend className={`mb-2 text-body font-semibold text-fg ${tarefaAtiva ? '' : 'opacity-50'}`}>
                Qual tarefa específica?
              </legend>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(TAREFA_LABEL) as Tarefa[]).map((tarefa) => (
                  <ToggleChip
                    key={tarefa}
                    id={tarefa === 'jogos' ? CAMPO_ID.tarefa : undefined}
                    name="tarefa"
                    label={TAREFA_LABEL[tarefa]}
                    checked={tarefaAtiva && form.tarefa === tarefa}
                    onChange={() => onChange({ tarefa })}
                    aria-invalid={errors.tarefa ? true : undefined}
                  />
                ))}
              </div>
              {errors.tarefa && tarefaAtiva ? (
                <p id="simulacao-tarefa-dica" className="text-small font-semibold text-danger">
                  {errors.tarefa}
                </p>
              ) : (
                <p id="simulacao-tarefa-dica" className="text-small text-fg-muted">
                  {tarefaAtiva ? 'Escolha uma tarefa.' : 'Disponível ao selecionar “Tarefa específica”.'}
                </p>
              )}
            </fieldset>
          </div>

          <Pergunta titulo="Em qual ambiente você vai usar?">
            <div className="flex flex-col gap-2 sm:flex-row">
              {(Object.keys(AMBIENTE_LABEL) as Ambiente[]).map((ambiente) => (
                <OptionCard
                  key={ambiente}
                  type="radio"
                  name="ambiente"
                  icon={AMBIENTE_ICON[ambiente]}
                  title={AMBIENTE_LABEL[ambiente]}
                  checked={form.ambiente === ambiente}
                  onChange={() => onChange({ ambiente })}
                />
              ))}
            </div>
          </Pergunta>

          <Pergunta titulo="Que tipo de ajuda é importante para você? (marque quantas quiser)">
            <div className="flex flex-col gap-2 sm:flex-row">
              <OptionCard
                type="checkbox"
                icon={Users}
                title={AJUDA_LABEL.forum}
                description="Espaço de perguntas e respostas mantido pela própria distro."
                checked={form.ajuda.includes('forum')}
                onChange={() => onChange({ ajuda: toggleAjuda(form.ajuda, 'forum') })}
              />
              <OptionCard
                type="checkbox"
                icon={BriefcaseBusiness}
                title={AJUDA_LABEL.pago}
                description="Possibilidade de contratar atendimento."
                checked={form.ajuda.includes('pago')}
                onChange={() => onChange({ ajuda: toggleAjuda(form.ajuda, 'pago') })}
              />
              <OptionCard
                type="checkbox"
                icon={CircleMinus}
                title={SEM_PREFERENCIA}
                description="O tipo de ajuda não altera o resultado."
                checked={form.ajuda.length === 0}
                onChange={() => onChange({ ajuda: [] })}
              />
            </div>
          </Pergunta>

          <Pergunta titulo="Qual é seu nível de experiência?">
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(NIVEL_LABEL) as Nivel[]).map((nivel) => (
                <ToggleChip
                  key={nivel}
                  name="nivel"
                  label={NIVEL_LABEL[nivel]}
                  checked={form.nivel === nivel}
                  onChange={() => onChange({ nivel })}
                />
              ))}
            </div>
            <p className="text-small text-fg-muted">{NIVEL_DICA[form.nivel]}</p>
          </Pergunta>
        </div>
      </Panel>

      <Panel
        title="02 · Hardware disponível"
        description="Informe os recursos disponíveis para instalar e executar o sistema."
      >
        <div className="grid gap-x-12 gap-y-5 lg:grid-cols-2">
          <RangeNumberField
            id={CAMPO_ID.ram}
            label="Memória RAM disponível"
            value={form.ram}
            onChange={(ram) => onChange({ ram })}
            min={0.5}
            max={64}
            step={0.5}
            minLabel="512 MB"
            maxLabel="64 GB"
            unit="GB"
            hint="Memória total do computador, em GB (ex.: 0,5 para 512 MB)."
            error={errors.ram}
          />
          <RangeNumberField
            id={CAMPO_ID.disco}
            label="Armazenamento disponível"
            value={form.disco}
            onChange={(disco) => onChange({ disco })}
            min={8}
            max={1024}
            step={8}
            minLabel="8 GB"
            maxLabel="1.024 GB"
            unit="GB"
            hint="Espaço livre para sistema, aplicativos e arquivos pessoais."
            error={errors.disco}
          />
        </div>
        <Pergunta titulo="Arquitetura do processador">
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(ARQUITETURA_LABEL) as Arquitetura[]).map((arquitetura) => (
              <ToggleChip
                key={arquitetura}
                name="arquitetura"
                label={ARQUITETURA_LABEL[arquitetura]}
                checked={form.arquitetura === arquitetura}
                onChange={() => onChange({ arquitetura })}
              />
            ))}
          </div>
        </Pergunta>
      </Panel>

      <Panel
        title="03 · Estabilidade e preferências"
        description="Escolha o modelo de atualização. Os campos marcados como opcionais refinam a análise, sem eliminar distros."
      >
        <Pergunta titulo="Como você prefere receber atualizações?">
          <div className="flex flex-col gap-2 sm:flex-row">
            {(
              [
                ['padrao', ShieldCheck, 'Lançamentos previsíveis e foco em estabilidade.'],
                ['rolling', RefreshCw, 'Atualizações contínuas e software mais recente.'],
              ] as const
            ).map(([valor, icon, description]) => (
              <OptionCard
                key={valor}
                type="radio"
                name="atualizacoes"
                icon={icon}
                title={ATUALIZACOES_LABEL[valor]}
                description={description}
                checked={form.atualizacoes === valor}
                onChange={() => onChange({ atualizacoes: valor })}
              />
            ))}
            <OptionCard
              type="radio"
              name="atualizacoes"
              icon={CircleMinus}
              title={SEM_PREFERENCIA}
              description="O modelo de atualização não altera o resultado."
              checked={form.atualizacoes === null}
              onChange={() => onChange({ atualizacoes: null })}
            />
          </div>
        </Pergunta>

        <div className="flex flex-col gap-4 sm:flex-row">
          <SelectField
            label="Ambiente gráfico (opcional)"
            value={form.desktop}
            onChange={(e) => onChange({ desktop: e.target.value })}
            options={selectOptions(opcoes.data?.desktops)}
            disabled={opcoesCarregando}
          />
          <SelectField
            label="Sistema init (opcional)"
            value={form.init}
            onChange={(e) => onChange({ init: e.target.value })}
            options={selectOptions(opcoes.data?.init)}
            disabled={opcoesCarregando}
          />
        </div>
        {opcoes.error ? (
          <Alert
            variant="erro"
            action={
              <button type="button" onClick={opcoes.retry} className="font-semibold text-accent hover:underline">
                Tentar novamente
              </button>
            }
          >
            {opcoes.error} Você ainda pode simular com “{SEM_PREFERENCIA}”.
          </Alert>
        ) : (
          <p className="text-small text-fg-muted">
            Você também pode escolher “{SEM_PREFERENCIA}” em cada campo opcional.
          </p>
        )}
      </Panel>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <p className="flex-1 text-label text-fg-muted">{rodape}</p>
        <Button type="submit" icon={Sparkles} loading={loading}>
          Atualizar recomendação
        </Button>
      </div>
    </form>
  )
}
