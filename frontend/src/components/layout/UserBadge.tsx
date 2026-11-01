import { useAuth } from '../../auth/authContext'

/** Login, "Conta pessoal" (só no desktop) e avatar com as 2 primeiras letras do login. */
export function UserBadge() {
  const { usuario } = useAuth()
  if (!usuario) return null
  return (
    <div className="flex items-center gap-2.5">
      <div className="hidden flex-col lg:flex">
        <span className="text-label font-semibold text-fg">{usuario.login}</span>
        <span className="text-caption text-fg-muted">Conta pessoal</span>
      </div>
      <span
        aria-hidden
        className="inline-flex size-icon-button shrink-0 items-center justify-center rounded-full bg-primary-soft text-label font-semibold text-on-primary-soft"
      >
        {usuario.login.slice(0, 2).toUpperCase()}
      </span>
    </div>
  )
}
