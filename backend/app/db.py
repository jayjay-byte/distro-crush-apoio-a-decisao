"""Conexão com o SQLite (backend/distro_crush.db)."""

from collections.abc import Iterator
from pathlib import Path

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

DB_PATH = Path(__file__).resolve().parents[1] / "distro_crush.db"


class Base(DeclarativeBase):
    pass


def make_engine(path: Path | str = DB_PATH) -> Engine:
    # check_same_thread=False: o FastAPI pode usar a sessão em outra thread.
    return create_engine(f"sqlite:///{path}", connect_args={"check_same_thread": False})


engine = make_engine()
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
