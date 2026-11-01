import { RotateCw } from 'lucide-react'
import { Alert } from './Alert'
import { Button } from './Button'

/** Erro de carregamento com "Tentar novamente" (usa o `retry` de `useRequest`). */
export function ErrorAlert({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Alert
      variant="erro"
      action={
        <Button variant="secondary" icon={RotateCw} onClick={onRetry} className="shrink-0">
          Tentar novamente
        </Button>
      }
    >
      {message}
    </Alert>
  )
}
