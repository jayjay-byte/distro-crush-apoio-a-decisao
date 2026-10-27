"""Roda o motor de decisão para uma persona e imprime o resultado no terminal.

Uso (dentro de backend/):
    python scripts/simular.py P1 [--pesos-iguais] [--db caminho.db]

Serve para conferência manual com a especificação (seção 8) e a aba `pesos`.
"""

import argparse
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from sqlalchemy.orm import Session  # noqa: E402

from app.db import DB_PATH, make_engine  # noqa: E402
from app.grouping import recomendar  # noqa: E402
from app.main import fetch_distros  # noqa: E402
from app.personas import PERSONAS  # noqa: E402
from app.schemas import DistroResultado  # noqa: E402


def _pct(ia: float) -> str:
    return f"{round(ia * 100)}%"


def _imprimir_distro(d: DistroResultado, recuo: str = "  ") -> None:
    print(f"{recuo}{d.posicao_geral:>2}. {d.nome:<18} IA {d.ia:.3f} ({_pct(d.ia)}, {d.rotulo})")
    if d.perdeu_pontos:
        print(f"{recuo}    perdeu pontos: {'; '.join(d.perdeu_pontos)}")
    for aviso in d.avisos:
        print(f"{recuo}    aviso: {aviso}")


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description="Simula uma persona no motor de decisão.")
    parser.add_argument("persona", help=f"uma de: {', '.join(PERSONAS)}")
    parser.add_argument("--pesos-iguais", action="store_true", help="análise de sensibilidade")
    parser.add_argument("--db", type=Path, default=DB_PATH, help="arquivo SQLite (rode o seed antes)")
    args = parser.parse_args()

    persona = args.persona.upper()
    if persona not in PERSONAS:
        sys.exit(f"Persona desconhecida: {args.persona}. Use uma de: {', '.join(PERSONAS)}.")
    if not args.db.exists():
        sys.exit(f"Banco não encontrado em {args.db}. Rode antes: python scripts/seed.py")

    respostas = PERSONAS[persona]
    engine = make_engine(args.db)
    with Session(engine) as db:
        distros = fetch_distros(db)
    engine.dispose()
    res = recomendar(distros, respostas, pesos_iguais=args.pesos_iguais)

    print(f"=== {persona} ({'pesos iguais' if args.pesos_iguais else 'pesos ROC'}) ===")
    for campo, valor in respostas.model_dump().items():
        print(f"  {campo:<13} {valor}")
    print(f"\nCompatíveis: {res.compativeis}   Peso respondido: {res.peso_respondido:.4f}")
    print("IA: quanto a distro atende às suas respostas, não é chance de sucesso.")

    if res.destaques:
        print("\nDestaque fora dos grupos")
        for d in res.destaques:
            _imprimir_distro(d)

    for g in res.grupos:
        print(f"\n{g.posicao}º {g.nome}: IA do grupo {_pct(g.ia)} ({g.ia:.4f}, {g.rotulo})")
        for d in g.distros:
            _imprimir_distro(d)

    if res.tambem_compativeis:
        print("\nTambém compatíveis")
        for d in res.tambem_compativeis:
            _imprimir_distro(d)

    for aviso in res.avisos:
        print(f"\nAviso: {aviso}")


if __name__ == "__main__":
    main()
