"""Schemas Pydantic de entrada e saída da API."""

from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, BeforeValidator, ConfigDict, Field, field_validator, model_validator
from pydantic_core import PydanticCustomError

from app.models import Distro


def split_multi(value: str | list[str] | None) -> list[str]:
    """Divide um campo multivalorado da ficha (`a|b`), com strip e sem vazios."""
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [part.strip() for part in value.split("|") if part.strip()]


MultiValue = Annotated[list[str], BeforeValidator(split_multi)]


class DistroOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    nome: str
    proposito: str
    tarefa_tipo: MultiValue
    ambiente: MultiValue
    suporte_comercial: str
    suporte_comunidade: str
    amigabilidade: int
    ram_min_gb: float | None
    req_tipo_ram: str | None
    disco_min_gb: float | None
    req_tipo_disco: str | None
    arquitetura: MultiValue
    modelo_lancamento: MultiValue
    desktops: MultiValue
    desktop_padrao: MultiValue
    init: MultiValue
    gerenciador_pacotes: MultiValue
    categoria: MultiValue
    aviso: str | None
    grupo: str
    grupo_nome: str
    no_livro: str | None
    familia: str | None

    @classmethod
    def from_model(cls, distro: Distro) -> "DistroOut":
        """Converte a linha do banco (o grupo precisa estar carregado)."""
        return cls.model_validate({
            **{c.key: getattr(distro, c.key) for c in Distro.__table__.columns},
            "grupo_nome": distro.grupo_rel.nome,
        })


class CriterioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    nome: str
    ordem: int
    peso: float  # peso ROC exato
    peso_sugerido: int  # escala de 0 a 10 do usuário: round(10 × w_k / w_1)


class OpcoesOut(BaseModel):
    init: list[str]
    desktops: list[str]


# Nota de importância de 0 a 10, só inteiro (2.5, "5" e true são recusados).
NotaPeso = Annotated[int, Field(strict=True, ge=0, le=10)]

PesosOrigem = Literal["roc", "usuario", "iguais"]  # "iguais" só no what-if com pesos=iguais

MSG_PESOS_ZERADOS = "Defina ao menos um peso maior que zero"


class PesosUsuario(BaseModel):
    """Importância de cada critério ponderado, de 0 a 10 (as 6 chaves são obrigatórias).

    O motor normaliza: peso_k = nota_k / Σ notas (pontuação direta, SMART).
    """

    model_config = ConfigDict(extra="forbid")

    proposito: NotaPeso
    usabilidade: NotaPeso
    suporte: NotaPeso
    estabilidade: NotaPeso
    init: NotaPeso
    ambiente_grafico: NotaPeso


class Respostas(BaseModel):
    """Respostas do formulário de simulação. `None` = uso geral / sem preferência.

    `pesos` ausente ou `None`: o motor usa os pesos ROC.
    """

    tarefa: Literal["jogos", "seguranca", "hardware_antigo"] | None = None
    ambiente: Literal["desktop", "servidor", "nuvem"]
    ram_gb: float = Field(ge=0)
    disco_gb: float = Field(ge=0)
    arquitetura: Literal["x86_64", "i686", "arm"]
    nivel: Literal["iniciante", "intermediario", "avancado"]
    ajuda: list[Literal["forum", "pago"]] | None = None
    atualizacoes: Literal["padrao", "rolling"] | None = None
    init: str | None = None
    desktop: str | None = None
    pesos: PesosUsuario | None = None

    @field_validator("ajuda")
    @classmethod
    def _ajuda(cls, value: list[str] | None) -> list[str] | None:
        # lista vazia = sem preferência; remove repetidos mantendo a ordem
        if not value:
            return None
        return list(dict.fromkeys(value))

    @field_validator("init", "desktop")
    @classmethod
    def _opcional(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return value.strip() or None

    def criterios_respondidos(self) -> set[str]:
        """Critérios que entram no IA. Propósito e usabilidade são sempre respondidos."""
        opcionais = {
            "suporte": self.ajuda,
            "estabilidade": self.atualizacoes,
            "init": self.init,
            "ambiente_grafico": self.desktop,
        }
        return {"proposito", "usabilidade"} | {cid for cid, valor in opcionais.items() if valor is not None}

    @model_validator(mode="after")
    def _pesos_respondidos(self) -> "Respostas":
        # Sem peso nos critérios respondidos o IA ficaria 0 / 0.
        if self.pesos is not None:
            notas = self.pesos.model_dump()
            if sum(notas[cid] for cid in self.criterios_respondidos()) == 0:
                raise PydanticCustomError("pesos_zerados", MSG_PESOS_ZERADOS)
        return self


class ContribuicaoOut(BaseModel):
    criterio: str
    respondido: bool
    peso: float
    nota: float | None
    contribuicao: float


class DistroResultado(BaseModel):
    id: str
    nome: str
    posicao_geral: int
    ia: float
    rotulo: str
    contribuicoes: list[ContribuicaoOut]
    perdeu_pontos: list[str]
    avisos: list[str]


class GrupoResultado(BaseModel):
    posicao: int
    nome: str
    ia: float
    rotulo: str
    distros: list[DistroResultado]


class Resultado(BaseModel):
    """Resultado de uma simulação (snapshot salvo em `resultados`)."""

    compativeis: int
    peso_respondido: float
    # Pesos usados nas contribuições. Snapshots antigos, sem o campo, foram calculados com ROC.
    pesos_origem: PesosOrigem = "roc"
    destaques: list[DistroResultado]
    grupos: list[GrupoResultado]
    tambem_compativeis: list[DistroResultado]
    avisos: list[str]


# --- Autenticação ----------------------------------------------------------

class LoginIn(BaseModel):
    login: str
    senha: str


class UsuarioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    login: str


class TokenOut(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    expira_em: datetime
    usuario: UsuarioOut


# --- Simulações ------------------------------------------------------------
# Datas sempre em UTC; o Pydantic serializa em ISO 8601 com "Z".

class GrupoResumo(BaseModel):
    nome: str
    ia: float
    rotulo: str


class DistroResumo(BaseModel):
    id: str
    nome: str
    ia: float
    rotulo: str


class SimulacaoResumo(BaseModel):
    """Linha da listagem de simulações salvas."""

    id: int
    data: datetime
    perfil: str  # ex.: "Iniciante · Uso geral · Desktop"
    proposito: str  # "geral" ou o valor de `tarefa`
    primeiro_grupo: GrupoResumo | None
    distro_maior_ia: DistroResumo | None


class SimulacaoPagina(BaseModel):
    itens: list[SimulacaoResumo]
    total: int
    pagina: int
    por_pagina: int
    total_paginas: int


class SimulacaoDetalhe(BaseModel):
    id: int
    data: datetime
    perfil: str
    respostas: Respostas
    resultado: Resultado  # snapshot salvo, sem recalcular


class GrupoRanking(BaseModel):
    posicao: int
    nome: str
    ia: float
    rotulo: str
    distros: int  # quantidade de compatíveis no grupo


class RankingGrupos(BaseModel):
    primeiro_grupo: GrupoRanking | None
    grupos: list[GrupoRanking]


class LadoSensibilidade(BaseModel):
    chave: PesosOrigem  # "usuario", "roc" ou "iguais"
    rotulo: str  # "Seus pesos", "Pesos ROC" ou "Pesos iguais"
    ranking: RankingGrupos


class SensibilidadeOut(BaseModel):
    """Comparação de rankings de grupos, todos recalculados com as respostas salvas e a base atual.

    - `comparacao = "roc_iguais"` (simulação sem pesos): principal = ROC, alternativo = pesos iguais;
    - `comparacao = "usuario_roc"` (simulação com pesos): principal = seus pesos, alternativo = ROC.

    `mesmo_primeiro_grupo` compara principal × alternativo. `roc` e `iguais` continuam sempre
    preenchidos, como antes desta mudança.
    """

    simulacao_id: int
    comparacao: Literal["roc_iguais", "usuario_roc"]
    principal: LadoSensibilidade
    alternativo: LadoSensibilidade
    mesmo_primeiro_grupo: bool
    roc: RankingGrupos
    iguais: RankingGrupos


# --- Dashboard -------------------------------------------------------------

class DistroContagem(BaseModel):
    id: str
    nome: str
    vezes: int  # vezes como distro de maior IA


class PropositoContagem(BaseModel):
    proposito: str
    rotulo: str
    total: int


class PontoIA(BaseModel):
    simulacao_id: int
    data: datetime
    ia: float
    rotulo: str
    grupo: str


class PrimeiroGrupoDetalhe(GrupoResumo):
    distros: list[DistroResumo]


class UltimaSimulacao(BaseModel):
    id: int
    data: datetime
    perfil: str
    ram_gb: float
    primeiro_grupo: PrimeiroGrupoDetalhe | None
    distro_maior_ia: DistroResumo | None


class DashboardOut(BaseModel):
    total_simulacoes: int
    simulacoes_mes_atual: int
    ultima_simulacao_em: datetime | None
    distros_mais_recomendadas: list[DistroContagem]
    simulacoes_por_proposito: list[PropositoContagem]
    ia_primeiro_grupo_por_simulacao: list[PontoIA]  # da mais antiga para a mais recente
    ultima_simulacao: UltimaSimulacao | None
