"""Schemas Pydantic de saída da API."""

from typing import Annotated

from pydantic import BaseModel, BeforeValidator, ConfigDict


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


class CriterioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    nome: str
    ordem: int
    peso: float


class OpcoesOut(BaseModel):
    init: list[str]
    desktops: list[str]
