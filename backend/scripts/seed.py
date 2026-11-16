"""Cria e popula o SQLite a partir de dados/ficha_distros_atualizada.xlsx.

Uso (dentro de backend/):
    python scripts/seed.py [--db caminho.db] [--xlsx caminho.xlsx]

Recria todas as tabelas a cada execução, então pode rodar várias vezes sem
duplicar dados (usuários e simulações salvas também são apagados).
"""

import argparse
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

import bcrypt  # noqa: E402
import openpyxl  # noqa: E402
from sqlalchemy import Engine, func, select  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402

from app.criteria import CRITERIOS, roc_weights  # noqa: E402
from app.db import DB_PATH, Base, make_engine  # noqa: E402
from app.models import Criterion, Distro, Group, User  # noqa: E402

XLSX_PATH = BACKEND_DIR.parent / "dados" / "ficha_distros_atualizada.xlsx"

# Valor da coluna `grupo` (sem acento) -> nome de exibição.
GRUPO_NOMES = {
    "Amigaveis base Ubuntu": "Amigáveis base Ubuntu",
    "Familia Debian": "Família Debian",
    "Generalistas e corporativas": "Generalistas e corporativas",
    "Familia Arch": "Família Arch",
    "Independentes sem systemd": "Independentes sem systemd",
    "Jogos": "Jogos",
    "Minimalistas": "Minimalistas",
}

COLUNAS_CRITERIOS = [
    "id", "nome", "proposito", "tarefa_tipo", "ambiente",
    "suporte_comercial", "suporte_comunidade", "amigabilidade",
    "ram_min_gb", "req_tipo_ram", "disco_min_gb", "req_tipo_disco", "arquitetura",
    "modelo_lancamento", "desktops", "desktop_padrao", "init",
    "gerenciador_pacotes", "categoria", "aviso", "grupo",
]
COLUNAS_FICHA = ["id", "no_livro", "familia"]

DEMO_LOGIN = "demo"
DEMO2_LOGIN = "demo2"  # segundo usuário, para testar o isolamento das simulações
DEMO_SENHA = "demo123"


class SeedError(Exception):
    pass


def _clean(value):
    if isinstance(value, str):
        value = value.strip()
        return value or None
    return value


def read_sheet(wb, name: str, required: list[str]) -> list[dict]:
    """Lê a aba pelo cabeçalho, ignorando linhas vazias."""
    if name not in wb.sheetnames:
        raise SeedError(f"Aba '{name}' não encontrada na planilha.")
    rows = wb[name].iter_rows(values_only=True)
    header = [_clean(h) for h in next(rows)]
    missing = [c for c in required if c not in header]
    if missing:
        raise SeedError(f"Aba '{name}': colunas ausentes: {', '.join(missing)}.")
    records = []
    for row in rows:
        if all(v is None or (isinstance(v, str) and not v.strip()) for v in row):
            continue
        record = {h: _clean(v) for h, v in zip(header, row) if h}
        records.append({c: record.get(c) for c in required})
    return records


def _to_float(value) -> float | None:
    return None if value is None else float(value)


def load_distros(xlsx_path: Path) -> list[dict]:
    wb = openpyxl.load_workbook(xlsx_path, read_only=True, data_only=True)
    try:
        criterios = read_sheet(wb, "criterios_decisao", COLUNAS_CRITERIOS)
        ficha = {r["id"]: r for r in read_sheet(wb, "ficha_completa", COLUNAS_FICHA)}
    finally:
        wb.close()

    distros = []
    for row in criterios:
        extra = ficha.get(row["id"])
        if extra is None:
            raise SeedError(f"Distro '{row['id']}' não existe na aba ficha_completa.")
        if row["grupo"] not in GRUPO_NOMES:
            raise SeedError(f"Distro '{row['id']}': grupo desconhecido '{row['grupo']}'.")
        distros.append({
            **row,
            "amigabilidade": int(row["amigabilidade"]),
            "ram_min_gb": _to_float(row["ram_min_gb"]),
            "disco_min_gb": _to_float(row["disco_min_gb"]),
            "no_livro": extra["no_livro"],
            "familia": extra["familia"],
        })
    return distros


def seed(engine: Engine, xlsx_path: Path = XLSX_PATH) -> dict[str, int]:
    distros = load_distros(xlsx_path)

    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)

    with Session(engine) as db:
        db.add_all(Group(id=gid, nome=nome) for gid, nome in GRUPO_NOMES.items())
        db.add_all(Distro(**d) for d in distros)
        pesos = roc_weights(len(CRITERIOS))
        db.add_all(
            Criterion(id=cid, nome=nome, ordem=ordem, peso=peso)
            for ordem, ((cid, nome), peso) in enumerate(zip(CRITERIOS, pesos), start=1)
        )
        db.add_all(
            User(login=login, senha_hash=bcrypt.hashpw(DEMO_SENHA.encode(), bcrypt.gensalt()).decode())
            for login in (DEMO_LOGIN, DEMO2_LOGIN)
        )
        db.commit()

        return {
            "distros": db.scalar(select(func.count()).select_from(Distro)),
            "grupos": db.scalar(select(func.count()).select_from(Group)),
            "criterios": db.scalar(select(func.count()).select_from(Criterion)),
            "usuarios": db.scalar(select(func.count()).select_from(User)),
        }


def main() -> None:
    parser = argparse.ArgumentParser(description="Popula o banco do Distro Crush a partir da ficha.")
    parser.add_argument("--db", type=Path, default=DB_PATH, help="arquivo SQLite de destino")
    parser.add_argument("--xlsx", type=Path, default=XLSX_PATH, help="planilha de origem")
    args = parser.parse_args()

    try:
        resumo = seed(make_engine(args.db), args.xlsx)
    except SeedError as exc:
        sys.exit(f"Erro no seed: {exc}")

    print(f"Banco criado em {args.db}")
    for tabela, total in resumo.items():
        print(f"  {tabela}: {total}")


if __name__ == "__main__":
    main()
