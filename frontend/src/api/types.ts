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
