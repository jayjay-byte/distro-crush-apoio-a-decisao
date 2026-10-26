from collections import Counter

import bcrypt
import pytest
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db import make_engine
from app.models import Distro, User
from scripts.seed import seed


def test_34_distros(client, engine):
    with Session(engine) as db:
        assert db.scalar(select(func.count()).select_from(Distro)) == 34
    assert len(client.get("/distros").json()) == 34


def test_grupos_e_quantidades(client):
    contagem = Counter(d["grupo_nome"] for d in client.get("/distros").json())
    assert contagem == {
        "Amigáveis base Ubuntu": 6,
        "Família Debian": 9,
        "Generalistas e corporativas": 6,
        "Família Arch": 4,
        "Independentes sem systemd": 4,
        "Jogos": 3,
        "Minimalistas": 2,
    }


def test_soma_pesos_roc_igual_a_1(client):
    pesos = [c["peso"] for c in client.get("/criterios").json()]
    assert sum(pesos) == pytest.approx(1.0)
    assert pesos == pytest.approx([0.408, 0.242, 0.158, 0.103, 0.061, 0.028], abs=1e-3)


def test_ordem_dos_criterios(client):
    nomes = [c["nome"] for c in client.get("/criterios").json()]
    assert nomes == ["Propósito", "Usabilidade", "Suporte", "Estabilidade", "Init", "Ambiente gráfico"]


def test_opcoes(client):
    opcoes = client.get("/opcoes").json()
    assert {"SysV", "systemd"} <= set(opcoes["init"])
    assert {"Xfce", "KDE Plasma"} <= set(opcoes["desktops"])
    for valores in opcoes.values():
        assert len(valores) == len(set(valores))
        assert all(v == v.strip() and "|" not in v for v in valores)


def test_distro_por_id(client):
    ubuntu = client.get("/distros/ubuntu").json()
    assert ubuntu["grupo_nome"] == "Amigáveis base Ubuntu"
    assert ubuntu["desktop_padrao"] == ["GNOME"]
    assert client.get("/distros/inexistente").status_code == 404


def test_usuario_demo_com_hash_bcrypt(engine):
    with Session(engine) as db:
        user = db.scalar(select(User).where(User.login == "demo"))
    assert user.senha_hash != "demo123"
    assert bcrypt.checkpw(b"demo123", user.senha_hash.encode())


def test_seed_pode_rodar_varias_vezes(tmp_path):
    engine = make_engine(tmp_path / "idempotente.db")
    seed(engine)
    resumo = seed(engine)
    engine.dispose()
    assert resumo == {"distros": 34, "grupos": 7, "criterios": 6, "usuarios": 1}
