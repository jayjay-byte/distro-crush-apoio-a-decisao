"""API do Distro Crush."""

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.db import get_db
from app.models import Criterion, Distro
from app.schemas import CriterioOut, DistroOut, OpcoesOut, split_multi

app = FastAPI(title="Distro Crush", description="Sistema de Apoio à Decisão para distribuições Linux")

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
