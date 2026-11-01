import { FlaskConical, Plus } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button } from './Button'
import { EmptyState } from './EmptyState'

/** Estado vazio do Dashboard e de Relatórios: usuário ainda sem simulações salvas. */
export function NoSimulations() {
  const navigate = useNavigate()
  return (
    <EmptyState
      icon={FlaskConical}
      title="Você ainda não tem simulações salvas"
      action={
        <Button icon={Plus} onClick={() => navigate('/simulacao')}>
          Fazer uma simulação
        </Button>
      }
    >
      Faça uma simulação e salve o resultado para ver indicadores e relatórios aqui.
    </EmptyState>
  )
}
