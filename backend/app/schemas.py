"""Schemas Pydantic de entrada e saída da API."""

from typing import Annotated, Literal

from pydantic import BaseModel, BeforeValidator, ConfigDict, Field, field_validator

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
    peso: float


class OpcoesOut(BaseModel):
    init: list[str]
    desktops: list[str]


class Respostas(BaseModel):
    """Respostas do formulário de simulação. `None` = uso geral / sem preferência."""

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
    destaques: list[DistroResultado]
    grupos: list[GrupoResultado]
    tambem_compativeis: list[DistroResultado]
    avisos: list[str]
