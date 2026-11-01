import { useCallback, useEffect, useRef, useState } from 'react'
import { describeApiError } from '../api/client'

export type RequestState<T> = {
  data: T | null
  loading: boolean
  error: string | null
  /** Repete a chamada (botão "Tentar novamente"). */
  retry: () => void
}

type Loaded<T> = { key: string; attempt: number; data: T | null; error: string | null }

/**
 * Executa `load` ao montar (e quando `key` muda), com estados de carregamento e
 * erro. Respostas que chegam depois de trocar a `key` ou desmontar são ignoradas.
 */
export function useRequest<T>(key: string, load: () => Promise<T>, errorFallback: string): RequestState<T> {
  const [attempt, setAttempt] = useState(0)
  const [loaded, setLoaded] = useState<Loaded<T> | null>(null)

  // `load` costuma ser uma função nova a cada render: a chamada depende só da chave e da tentativa.
  const request = useRef({ load, errorFallback })
  useEffect(() => {
    request.current = { load, errorFallback }
  })

  useEffect(() => {
    let active = true
    const { load: run, errorFallback: fallback } = request.current
    run().then(
      (data) => active && setLoaded({ key, attempt, data, error: null }),
      (err: unknown) => active && setLoaded({ key, attempt, data: null, error: describeApiError(err, fallback) }),
    )
    return () => {
      active = false
    }
  }, [key, attempt])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])
  const current = loaded && loaded.key === key && loaded.attempt === attempt ? loaded : null

  return {
    data: current?.data ?? null,
    loading: current === null,
    error: current?.error ?? null,
    retry,
  }
}
