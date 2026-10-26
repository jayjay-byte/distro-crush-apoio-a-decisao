"""Tabelas do SQLite.

Os campos com vários valores (ex.: `desktop|servidor`) ficam como na ficha,
com o separador `|`; o split é feito na leitura (ver `schemas.split_multi`).
"""

from datetime import datetime

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class Group(Base):
    __tablename__ = "grupos"

    id: Mapped[str] = mapped_column(String, primary_key=True)  # valor da coluna `grupo` da ficha
    nome: Mapped[str] = mapped_column(String)  # com acentos, para exibição

    distros: Mapped[list["Distro"]] = relationship(back_populates="grupo_rel")


class Distro(Base):
    __tablename__ = "distros"

    # aba criterios_decisao
    id: Mapped[str] = mapped_column(String, primary_key=True)
    nome: Mapped[str] = mapped_column(String)
    proposito: Mapped[str] = mapped_column(String)
    tarefa_tipo: Mapped[str | None] = mapped_column(String)
    ambiente: Mapped[str] = mapped_column(String)
    suporte_comercial: Mapped[str] = mapped_column(String)
    suporte_comunidade: Mapped[str] = mapped_column(String)
    amigabilidade: Mapped[int] = mapped_column(Integer)
    ram_min_gb: Mapped[float | None] = mapped_column(Float)
    req_tipo_ram: Mapped[str | None] = mapped_column(String)
    disco_min_gb: Mapped[float | None] = mapped_column(Float)
    req_tipo_disco: Mapped[str | None] = mapped_column(String)
    arquitetura: Mapped[str] = mapped_column(String)
    modelo_lancamento: Mapped[str] = mapped_column(String)
    desktops: Mapped[str | None] = mapped_column(Text)
    desktop_padrao: Mapped[str | None] = mapped_column(String)
    init: Mapped[str | None] = mapped_column(String)
    gerenciador_pacotes: Mapped[str | None] = mapped_column(String)
    categoria: Mapped[str | None] = mapped_column(String)
    aviso: Mapped[str | None] = mapped_column(Text)
    grupo: Mapped[str] = mapped_column(ForeignKey("grupos.id"))

    # aba ficha_completa
    no_livro: Mapped[str | None] = mapped_column(String)
    familia: Mapped[str | None] = mapped_column(String)

    grupo_rel: Mapped[Group] = relationship(back_populates="distros")


class Criterion(Base):
    __tablename__ = "criterios"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    nome: Mapped[str] = mapped_column(String)
    ordem: Mapped[int] = mapped_column(Integer, unique=True)
    peso: Mapped[float] = mapped_column(Float)


class User(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    login: Mapped[str] = mapped_column(String, unique=True)
    senha_hash: Mapped[str] = mapped_column(String)
    criado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    simulacoes: Mapped[list["Simulation"]] = relationship(back_populates="usuario")


class Simulation(Base):
    __tablename__ = "simulacoes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"))
    respostas: Mapped[dict] = mapped_column(JSON)
    criado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    usuario: Mapped[User] = relationship(back_populates="simulacoes")
    resultado: Mapped["Result | None"] = relationship(back_populates="simulacao")


class Result(Base):
    __tablename__ = "resultados"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    simulacao_id: Mapped[int] = mapped_column(ForeignKey("simulacoes.id"), unique=True)
    dados: Mapped[dict] = mapped_column(JSON)  # snapshot completo do resultado
    criado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    simulacao: Mapped[Simulation] = relationship(back_populates="resultado")
