// Tipos das respostas da API usadas no front-end (espelham backend/app/schemas.py).

export type Usuario = {
  id: number
  login: string
}

export type LoginIn = {
  login: string
  senha: string
}

export type TokenOut = {
  access_token: string
  token_type: 'bearer'
  /** ISO 8601 em UTC (com Z). */
  expira_em: string
  usuario: Usuario
}

// --- Simulação (POST /recomendacao, POST /simulacoes) ----------------------

export type Tarefa = 'jogos' | 'seguranca' | 'hardware_antigo'
export type Ambiente = 'desktop' | 'servidor' | 'nuvem'
export type Arquitetura = 'x86_64' | 'i686' | 'arm'
export type Nivel = 'iniciante' | 'intermediario' | 'avancado'
export type Ajuda = 'forum' | 'pago'
export type Atualizacoes = 'padrao' | 'rolling'

/** Respostas do formulário no formato da API (`null` = sem preferência / uso geral). */
export type Respostas = {
  tarefa: Tarefa | null
  ambiente: Ambiente
  ram_gb: number
  disco_gb: number
  arquitetura: Arquitetura
  nivel: Nivel
  ajuda: Ajuda[] | null
  atualizacoes: Atualizacoes | null
  init: string | null
  desktop: string | null
}

export type CriterioId = 'proposito' | 'usabilidade' | 'suporte' | 'estabilidade' | 'init' | 'ambiente_grafico'

export type Rotulo = 'Muito alta' | 'Alta' | 'Média' | 'Baixa'

export type Contribuicao = {
  criterio: CriterioId
  respondido: boolean
  peso: number
  /** `null` quando o critério não foi respondido. */
  nota: number | null
  contribuicao: number
}

export type DistroResultado = {
  id: string
  nome: string
  posicao_geral: number
  ia: number
  rotulo: Rotulo
  contribuicoes: Contribuicao[]
  perdeu_pontos: string[]
  avisos: string[]
}

export type GrupoResultado = {
  posicao: number
  nome: string
  ia: number
  rotulo: Rotulo
  distros: DistroResultado[]
}

export type Resultado = {
  compativeis: number
  peso_respondido: number
  destaques: DistroResultado[]
  grupos: GrupoResultado[]
  tambem_compativeis: DistroResultado[]
  avisos: string[]
}

export type SimulacaoDetalhe = {
  id: number
  /** ISO 8601 em UTC (com Z). */
  data: string
  perfil: string
  respostas: Respostas
  resultado: Resultado
}

// --- Base de distros (GET /distros/{id}, GET /opcoes) ----------------------

export type DistroOut = {
  id: string
  nome: string
  proposito: string
  tarefa_tipo: string[]
  ambiente: string[]
  suporte_comercial: string
  suporte_comunidade: string
  amigabilidade: number
  ram_min_gb: number | null
  req_tipo_ram: string | null
  disco_min_gb: number | null
  req_tipo_disco: string | null
  arquitetura: string[]
  modelo_lancamento: string[]
  desktops: string[]
  desktop_padrao: string[]
  init: string[]
  gerenciador_pacotes: string[]
  categoria: string[]
  aviso: string | null
  grupo: string
  grupo_nome: string
  no_livro: string | null
  familia: string | null
}

export type OpcoesOut = {
  init: string[]
  desktops: string[]
}
