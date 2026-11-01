import { ArrowRight, Eye, EyeOff, UserRound } from 'lucide-react'
import { useState, type SubmitEvent } from 'react'
import { ApiError, NETWORK_ERROR_MESSAGE } from '../../api/client'
import { useAuth } from '../../auth/authContext'
import { Button } from '../ui/Button'
import { Checkbox } from '../ui/Checkbox'
import { FutureFeature } from '../ui/FutureFeature'
import { TextField } from '../ui/TextField'

const LINK = 'text-label font-semibold text-accent disabled:opacity-50'

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Usuário ou senha inválidos.'
    if (error.message === NETWORK_ERROR_MESSAGE) return NETWORK_ERROR_MESSAGE
  }
  return 'Não foi possível entrar. Tente novamente.'
}

/**
 * Formulário de acesso (Figma 10:22145), integrado ao POST /auth/login.
 * Com o login concluído, a página de Login redireciona sozinha.
 */
export function LoginForm() {
  const { login } = useAuth()
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!usuario.trim() || !senha) {
      setError('Informe o usuário e a senha.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      await login(usuario.trim(), senha)
    } catch (err) {
      setError(errorMessage(err))
      setLoading(false)
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex w-full max-w-login-form flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-title font-extrabold text-fg">Bem-vindo de volta</h1>
        <p className="text-lead text-fg-muted">Entre para simular, comparar e salvar suas escolhas.</p>
      </div>

      <div className="flex flex-col gap-4.5">
        <TextField
          label="Usuário"
          name="login"
          autoComplete="username"
          placeholder="demo"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          aria-invalid={error ? true : undefined}
          trailing={<UserRound aria-hidden className="size-4 shrink-0" />}
        />
        <TextField
          label="Senha"
          name="senha"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          aria-invalid={error ? true : undefined}
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              aria-pressed={showPassword}
              className="shrink-0 rounded-xs hover:text-fg focus-visible:outline-2 focus-visible:outline-accent"
            >
              {showPassword ? <EyeOff aria-hidden className="size-4" /> : <Eye aria-hidden className="size-4" />}
            </button>
          }
        />

        {/* Só visual no piloto. A sessão já fica salva no navegador, por isso "Lembrar-me" aparece marcado. */}
        <div className="flex flex-col items-start gap-3 lg:flex-row lg:items-center lg:justify-between">
          <FutureFeature>
            <Checkbox label="Lembrar-me" defaultChecked disabled />
          </FutureFeature>
          <FutureFeature>
            <button type="button" disabled className={LINK}>
              Esqueci minha senha
            </button>
          </FutureFeature>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-md border border-danger-border bg-danger-soft px-3 py-2 text-label text-danger">
          {error}
        </p>
      )}

      <Button type="submit" icon={ArrowRight} loading={loading} fullWidth>
        {loading ? 'Entrando…' : 'Entrar'}
      </Button>

      <p className="flex flex-wrap justify-center gap-1.25 text-body text-fg-muted">
        Ainda não tem conta?
        <FutureFeature>
          <button type="button" disabled className={`${LINK} text-body`}>
            Criar conta
          </button>
        </FutureFeature>
      </p>

      <hr className="border-line" />

      <p className="text-center text-small text-fg-muted">
        Seus dados ajudam a personalizar a análise.
        <br />
        Privacidade e segurança em cada etapa.
      </p>
    </form>
  )
}
