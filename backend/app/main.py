"""API do Distro Crush."""

import math
import os
from datetime import UTC, datetime
from typing import Literal

from fastapi import Depends, FastAPI, HTTPException, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload, selectinload

from app import summary
from app.auth import autenticar, criar_token, get_usuario_atual
from app.db import DB_PATH, engine, get_db
from app.grouping import recomendar
from app.models import Criterion, Distro, Result, Simulation, User
from app.schemas import (
    CriterioOut,
    DashboardOut,
    DistroOut,
    LoginIn,
    OpcoesOut,
    Respostas,
    Resultado,
    SensibilidadeOut,
    SimulacaoDetalhe,
    SimulacaoPagina,
    TokenOut,
    UsuarioOut,
    split_multi,
)

if os.environ.get("VERCEL") and not DB_PATH.exists():
    # Na Vercel o banco não vem no deploy: o seed roda no início a frio, em /tmp.
    from scripts.seed import seed

    seed(engine)

app = FastAPI(title="Distro Crush", description="Sistema de Apoio à Decisão para distribuições Linux")

API_PREFIX = "/api"


@app.middleware("http")
async def strip_api_prefix(request: Request, call_next):
    """Na Vercel a rota pública é /api/...; localmente o proxy do Vite já tira o prefixo.

    Remove /api do caminho e o guarda em `root_path`, para que /api/docs também funcione.
    """
    path = request.scope["path"]
    if path == API_PREFIX or path.startswith(f"{API_PREFIX}/"):
        request.scope["path"] = path[len(API_PREFIX):] or "/"
        request.scope["raw_path"] = request.scope["path"].encode()
        request.scope["root_path"] = API_PREFIX
    return await call_next(request)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def fetch_distros(db: Session) -> list[DistroOut]:
    """Todas as distros, em ordem alfabética (entrada do motor de decisão)."""
    distros = db.scalars(select(Distro).options(joinedload(Distro.grupo_rel))).all()
    return [DistroOut.from_model(d) for d in sorted(distros, key=lambda d: d.nome.casefold())]


def _distinct(values: list[str | None]) -> list[str]:
    unique = {part for value in values for part in split_multi(value)}
    return sorted(unique, key=str.casefold)


def _salva(sim: Simulation) -> summary.SimulacaoSalva:
    return summary.SimulacaoSalva(
        id=sim.id,
        data=sim.criado_em,
        respostas=Respostas.model_validate(sim.respostas),
        resultado=Resultado.model_validate(sim.resultado.dados),
    )


def _simulacao_do_usuario(db: Session, simulacao_id: int, usuario: User) -> Simulation:
    """Simulação inexistente ou de outro usuário: 404 nos dois casos."""
    sim = db.get(Simulation, simulacao_id, options=[selectinload(Simulation.resultado)])
    if sim is None or sim.usuario_id != usuario.id:
        raise HTTPException(status_code=404, detail="Simulação não encontrada")
    return sim


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/distros", response_model=list[DistroOut])
def list_distros(db: Session = Depends(get_db)) -> list[DistroOut]:
    return fetch_distros(db)


@app.get("/distros/{distro_id}", response_model=DistroOut)
def get_distro(distro_id: str, db: Session = Depends(get_db)) -> DistroOut:
    distro = db.get(Distro, distro_id, options=[joinedload(Distro.grupo_rel)])
    if distro is None:
        raise HTTPException(status_code=404, detail="Distro não encontrada")
    return DistroOut.from_model(distro)


@app.get("/criterios", response_model=list[CriterioOut])
def list_criterios(db: Session = Depends(get_db)) -> list[Criterion]:
    return list(db.scalars(select(Criterion).order_by(Criterion.ordem)))


@app.get("/opcoes", response_model=OpcoesOut)
def opcoes(db: Session = Depends(get_db)) -> OpcoesOut:
    """Valores distintos de init e desktops, para o formulário de simulação."""
    return OpcoesOut(
        init=_distinct(list(db.scalars(select(Distro.init)))),
        desktops=_distinct(list(db.scalars(select(Distro.desktops)))),
    )


# --- Autenticação ----------------------------------------------------------

@app.post("/auth/login", response_model=TokenOut)
def login(dados: LoginIn, db: Session = Depends(get_db)) -> TokenOut:
    user = autenticar(db, dados.login, dados.senha)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário ou senha inválidos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token, expira_em = criar_token(user)
    return TokenOut(access_token=token, expira_em=expira_em, usuario=UsuarioOut.model_validate(user))


# --- Recomendação e simulações (exigem login) ------------------------------

@app.post("/recomendacao", response_model=Resultado)
def recomendacao(
    respostas: Respostas,
    pesos: Literal["roc", "iguais"] = "roc",
    db: Session = Depends(get_db),
    _: User = Depends(get_usuario_atual),
) -> Resultado:
    """What-if: calcula sem salvar. `pesos=iguais` para a análise de sensibilidade."""
    return recomendar(fetch_distros(db), respostas, pesos_iguais=pesos == "iguais")


@app.post("/simulacoes", response_model=SimulacaoDetalhe, status_code=status.HTTP_201_CREATED)
def salvar_simulacao(
    respostas: Respostas,
    db: Session = Depends(get_db),
    usuario: User = Depends(get_usuario_atual),
) -> SimulacaoDetalhe:
    """Calcula com pesos ROC e salva as respostas e o snapshot do resultado."""
    resultado = recomendar(fetch_distros(db), respostas)
    sim = Simulation(
        usuario_id=usuario.id,
        respostas=respostas.model_dump(mode="json"),
        resultado=Result(dados=resultado.model_dump(mode="json")),
    )
    db.add(sim)
    db.commit()
    return summary.detalhe(_salva(sim))


@app.get("/simulacoes", response_model=SimulacaoPagina)
def listar_simulacoes(
    pagina: int = Query(1, ge=1),
    por_pagina: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    usuario: User = Depends(get_usuario_atual),
) -> SimulacaoPagina:
    """Simulações do usuário logado, da mais recente para a mais antiga."""
    total = db.scalar(select(func.count()).select_from(Simulation).where(Simulation.usuario_id == usuario.id))
    sims = db.scalars(
        select(Simulation)
        .where(Simulation.usuario_id == usuario.id)
        .order_by(Simulation.criado_em.desc(), Simulation.id.desc())
        .offset((pagina - 1) * por_pagina)
        .limit(por_pagina)
        .options(selectinload(Simulation.resultado))
    ).all()
    return SimulacaoPagina(
        itens=[summary.resumo(_salva(s)) for s in sims],
        total=total,
        pagina=pagina,
        por_pagina=por_pagina,
        total_paginas=math.ceil(total / por_pagina),
    )


@app.get("/simulacoes/{simulacao_id}", response_model=SimulacaoDetalhe)
def obter_simulacao(
    simulacao_id: int,
    db: Session = Depends(get_db),
    usuario: User = Depends(get_usuario_atual),
) -> SimulacaoDetalhe:
    return summary.detalhe(_salva(_simulacao_do_usuario(db, simulacao_id, usuario)))


@app.get("/simulacoes/{simulacao_id}/sensibilidade", response_model=SensibilidadeOut)
def sensibilidade(
    simulacao_id: int,
    db: Session = Depends(get_db),
    usuario: User = Depends(get_usuario_atual),
) -> SensibilidadeOut:
    """ROC × pesos iguais, os dois recalculados com as respostas salvas e a base atual."""
    sim = _simulacao_do_usuario(db, simulacao_id, usuario)
    respostas = Respostas.model_validate(sim.respostas)
    distros = fetch_distros(db)
    return summary.sensibilidade(
        sim.id,
        roc=recomendar(distros, respostas),
        iguais=recomendar(distros, respostas, pesos_iguais=True),
    )


@app.get("/dashboard", response_model=DashboardOut)
def dashboard(db: Session = Depends(get_db), usuario: User = Depends(get_usuario_atual)) -> DashboardOut:
    """Indicadores do Dashboard, só com as simulações do usuário logado."""
    sims = db.scalars(
        select(Simulation)
        .where(Simulation.usuario_id == usuario.id)
        .options(selectinload(Simulation.resultado))
    ).all()
    return summary.montar_dashboard([_salva(s) for s in sims], agora=datetime.now(UTC))
