import { Bookmark, BookmarkCheck, CircleCheck, LoaderCircle, RefreshCw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { describeApiError } from '../api/client'
import { recomendar, salvarSimulacao } from '../api/simulacao'
import type { Resultado } from '../api/types'
import { PageHeader } from '../components/layout/PageHeader'
import { ResultHeader } from '../components/result/ResultHeader'
import { ResultView } from '../components/result/ResultView'
import { SimulacaoForm } from '../components/simulacao/SimulacaoForm'
import {
  CAMPO_ID,
  INITIAL_FORM,
  TOTAL_PERGUNTAS,
  respostasKey,
  toRespostas,
  validate,
  type FormErrors,
  type FormState,
} from '../components/simulacao/formState'
import { StepsProgress } from '../components/simulacao/StepsProgress'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { useOpcoes } from '../hooks/useOpcoes'
import { formatDataHora } from '../utils/format'

type Analise = {
  resultado: Resultado
  /** Respostas que geraram o resultado (ver `respostasKey`). */
  key: string
  em: Date
  /** Muda a cada "Atualizar recomendação": reinicia o estado do resultado (detalhamento aberto). */
  versao: number
}

/** Ordem de foco quando há erros de validação. */
const ORDEM_ERROS: (keyof FormErrors)[] = ['tarefa', 'ram', 'disco']

const SALVAR_BLOQUEADO = 'Atualize a recomendação antes de salvar'

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Módulo de simulação (Figma 10:22744 / 10:23026): formulário, what-if
 * (POST /recomendacao) e Salvar (POST /simulacoes). O resultado e o
 * detalhamento ficam na própria tela, abaixo do formulário.
 */
export default function Simulacao() {
  const opcoes = useOpcoes()
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [tentouEnviar, setTentouEnviar] = useState(false)

  const [analise, setAnalise] = useState<Analise | null>(null)
  const [analisando, setAnalisando] = useState(false)
  const [erroAnalise, setErroAnalise] = useState<string | null>(null)

  const [salva, setSalva] = useState<{ key: string; data: string } | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [erroSalvar, setErroSalvar] = useState<string | null>(null)

  const resultadoRef = useRef<HTMLElement>(null)

  const errors = validate(form)
  const valido = Object.keys(errors).length === 0
  // RAM e disco mostram o erro ao digitar; a tarefa, só depois de tentar enviar.
  const errosVisiveis: FormErrors = { ram: errors.ram, disco: errors.disco, tarefa: tentouEnviar ? errors.tarefa : undefined }

  const keyAtual = valido ? respostasKey(toRespostas(form)) : null
  const mudou = analise !== null && keyAtual !== analise.key
  const salvaAtual = salva !== null && analise !== null && !mudou && salva.key === analise.key

  // Leva o usuário ao resultado novo (não ao salvar, que mantém a mesma versão).
  const versao = analise?.versao
  useEffect(() => {
    if (versao === undefined) return
    resultadoRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
  }, [versao])

  function atualizarForm(patch: Partial<FormState>) {
    setForm((atual) => ({ ...atual, ...patch }))
  }

  async function atualizarRecomendacao() {
    setTentouEnviar(true)
    const campoInvalido = ORDEM_ERROS.find((campo) => errors[campo])
    if (campoInvalido) {
      document.getElementById(CAMPO_ID[campoInvalido])?.focus()
      return
    }
    const respostas = toRespostas(form)
    setAnalisando(true)
    setErroAnalise(null)
    try {
      const resultado = await recomendar(respostas)
      setAnalise((anterior) => ({
        resultado,
        key: respostasKey(respostas),
        em: new Date(),
        versao: (anterior?.versao ?? 0) + 1,
      }))
      setErroSalvar(null)
    } catch (err) {
      setErroAnalise(describeApiError(err, 'Não foi possível calcular a recomendação. Tente novamente.'))
    } finally {
      setAnalisando(false)
    }
  }

  async function salvar() {
    if (!analise || mudou || !keyAtual) return
    setSalvando(true)
    setErroSalvar(null)
    try {
      const simulacao = await salvarSimulacao(toRespostas(form))
      // Exibe o snapshot salvo (mesmas respostas, calculado com ROC no servidor).
      setAnalise((anterior) => anterior && { ...anterior, resultado: simulacao.resultado })
      setSalva({ key: keyAtual, data: simulacao.data })
    } catch (err) {
      setErroSalvar(describeApiError(err, 'Não foi possível salvar a simulação. Tente novamente.'))
    } finally {
      setSalvando(false)
    }
  }

  const resultadoAtual = analise !== null && !mudou
  const etapas = [
    { label: 'Perfil', concluida: !errors.tarefa },
    { label: 'Hardware', concluida: !errors.ram && !errors.disco },
    // Todas as perguntas de preferência têm "Sem preferência": a etapa está sempre respondida.
    { label: 'Preferências', concluida: true },
    { label: 'Resultado', concluida: resultadoAtual },
  ]
  const concluidas = etapas.filter((e) => e.concluida).length
  const situacao = salvaAtual
    ? 'resultado salvo'
    : resultadoAtual
      ? 'resultado disponível'
      : valido
        ? 'pronto para atualizar a recomendação'
        : 'complete as etapas pendentes'

  const respondidas = TOTAL_PERGUNTAS - Object.keys(errors).length
  const rodape = `${respondidas} ${respondidas === 1 ? 'resposta preenchida' : 'respostas preenchidas'} · ${
    analise ? `última análise em ${formatDataHora(analise.em)}` : 'nenhuma análise ainda'
  }`

  function botaoSalvar(className: string, fullWidth = false) {
    return (
      <span title={mudou ? SALVAR_BLOQUEADO : undefined} className={className}>
        <Button
          icon={salvaAtual ? BookmarkCheck : Bookmark}
          loading={salvando}
          disabled={mudou || salvaAtual}
          onClick={salvar}
          fullWidth={fullWidth}
        >
          {salvaAtual ? 'Salva' : 'Salvar'}
        </Button>
      </span>
    )
  }

  return (
    <>
      <PageHeader
        eyebrow="RECOMENDAÇÃO PERSONALIZADA"
        title="Módulo de simulação"
        description="Conte sobre seu uso. Veja quais grupos de distribuições combinam com você."
      />

      <StepsProgress etapas={etapas} resumo={`${concluidas} de ${etapas.length} etapas · ${situacao}`} />

      <SimulacaoForm
        form={form}
        onChange={atualizarForm}
        errors={errosVisiveis}
        opcoes={opcoes}
        onSubmit={atualizarRecomendacao}
        loading={analisando}
        rodape={rodape}
      />

      <section
        ref={resultadoRef}
        aria-label="Resultado da simulação"
        aria-busy={analisando || undefined}
        className="flex scroll-mt-36 flex-col gap-4 pt-2 lg:scroll-mt-24"
      >
        {analise ? (
          <>
            <ResultHeader
              resultado={analise.resultado}
              eyebrow="04 · RESULTADO"
              actions={botaoSalvar('hidden lg:inline-flex')}
            />

            {mudou && (
              <Alert icon={RefreshCw} title={SALVAR_BLOQUEADO + '.'}>
                As respostas mudaram desde a última análise. Clique em Atualizar recomendação para ver o resultado
                novo.
              </Alert>
            )}
            {erroAnalise && <Alert variant="erro">{erroAnalise}</Alert>}
            {salvaAtual && salva && (
              <Alert icon={CircleCheck}>Simulação salva em {formatDataHora(salva.data)}.</Alert>
            )}
            {erroSalvar && <Alert variant="erro">{erroSalvar}</Alert>}

            <div className={`transition-opacity ${analisando ? 'opacity-60' : ''}`}>
              <ResultView key={analise.versao} resultado={analise.resultado} />
            </div>

            {botaoSalvar('hidden justify-end lg:flex')}
            <div className="sticky bottom-0 -mx-4 border-t border-line bg-surface px-4 py-3 lg:hidden">
              {botaoSalvar('flex', true)}
            </div>
          </>
        ) : analisando ? (
          <div role="status" className="flex items-center justify-center gap-2 rounded-lg border border-line bg-card p-8 text-body text-fg-muted">
            <LoaderCircle aria-hidden className="size-5 animate-spin text-accent" />
            Calculando recomendação…
          </div>
        ) : erroAnalise ? (
          <Alert variant="erro">{erroAnalise}</Alert>
        ) : (
          <div className="flex flex-col gap-1 rounded-lg border border-dashed border-line p-6 text-center">
            <p className="text-small font-semibold text-accent">04 · RESULTADO</p>
            <p className="text-body text-fg-muted">
              Preencha as respostas e clique em Atualizar recomendação para ver os grupos de distros que combinam com
              você.
            </p>
          </div>
        )}
      </section>

      <p className="text-small text-fg-subtle">
        Antes de instalar, confirme requisitos da versão e teste a distribuição em uma sessão ao vivo.
      </p>
    </>
  )
}
