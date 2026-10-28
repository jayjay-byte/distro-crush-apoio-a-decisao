"""Testes da API: autenticação, what-if, simulações salvas, sensibilidade e Dashboard."""

from datetime import UTC, datetime

import jwt
import pytest
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.auth import ALGORITHM, SECRET_KEY
from app.grouping import recomendar
from app.models import Result, Simulation
from app.personas import PERSONAS
from app.summary import SimulacaoSalva, montar_dashboard, perfil_resumido


def auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def corpo(persona: str) -> dict:
    return PERSONAS[persona].model_dump(mode="json")


@pytest.fixture(autouse=True)
def banco_limpo(engine):
    """O banco de teste é compartilhado na sessão: cada teste começa sem simulações."""
    with Session(engine) as db:
        db.execute(delete(Result))
        db.execute(delete(Simulation))
        db.commit()


def contar_simulacoes(engine) -> int:
    with Session(engine) as db:
        return db.scalar(select(func.count()).select_from(Simulation))


def salvar(client, token, *personas: str) -> list[int]:
    ids = []
    for p in personas:
        resp = client.post("/simulacoes", json=corpo(p), headers=auth(token))
        assert resp.status_code == 201
        ids.append(resp.json()["id"])
    return ids


# --- Autenticação ----------------------------------------------------------

def test_login_valido(client):
    resp = client.post("/auth/login", json={"login": "demo", "senha": "demo123"})
    assert resp.status_code == 200
    dados = resp.json()
    assert dados["token_type"] == "bearer"
    assert dados["usuario"]["login"] == "demo"
    payload = jwt.decode(dados["access_token"], SECRET_KEY, algorithms=[ALGORITHM])
    assert payload["sub"] == str(dados["usuario"]["id"])


@pytest.mark.parametrize("login,senha", [("demo", "errada"), ("ninguem", "demo123")])
def test_login_invalido(client, login, senha):
    resp = client.post("/auth/login", json={"login": login, "senha": senha})
    assert resp.status_code == 401
    assert resp.json()["detail"] == "Usuário ou senha inválidos"


@pytest.mark.parametrize("metodo,rota", [
    ("post", "/recomendacao"),
    ("post", "/simulacoes"),
    ("get", "/simulacoes"),
    ("get", "/simulacoes/1"),
    ("get", "/simulacoes/1/sensibilidade"),
    ("get", "/dashboard"),
])
def test_rota_protegida_sem_token(client, metodo, rota):
    resp = client.request(metodo, rota, json=corpo("P1"))
    assert resp.status_code == 401


def test_token_adulterado(client, token_demo):
    resp = client.get("/dashboard", headers=auth(token_demo + "x"))
    assert resp.status_code == 401


# --- Recomendação (what-if) ------------------------------------------------

def test_recomendacao_p1_igual_ao_motor_e_nao_salva(client, token_demo, distros, engine):
    resp = client.post("/recomendacao", json=corpo("P1"), headers=auth(token_demo))
    assert resp.status_code == 200
    dados = resp.json()
    assert dados == recomendar(distros, PERSONAS["P1"]).model_dump(mode="json")
    assert dados["grupos"][0]["nome"] == "Amigáveis base Ubuntu"
    assert dados["grupos"][0]["ia"] == pytest.approx(0.9185, abs=1e-3)
    assert contar_simulacoes(engine) == 0


def test_recomendacao_pesos_iguais_mantem_primeiro_grupo_p1(client, token_demo):
    resp = client.post("/recomendacao?pesos=iguais", json=corpo("P1"), headers=auth(token_demo))
    assert resp.status_code == 200
    assert resp.json()["grupos"][0]["nome"] == "Amigáveis base Ubuntu"


# --- Simulações salvas -----------------------------------------------------

def test_salvar_listar_e_detalhar(client, token_demo, distros, engine):
    [sim_id] = salvar(client, token_demo, "P1")
    assert contar_simulacoes(engine) == 1

    pagina = client.get("/simulacoes", headers=auth(token_demo)).json()
    assert pagina["total"] == 1
    item = pagina["itens"][0]
    assert item["id"] == sim_id
    assert item["perfil"] == "Iniciante · Uso geral · Desktop"
    assert item["proposito"] == "geral"
    assert item["primeiro_grupo"]["nome"] == "Amigáveis base Ubuntu"
    assert item["primeiro_grupo"]["ia"] == pytest.approx(0.9185, abs=1e-3)
    assert item["distro_maior_ia"]["nome"] == "Linux Mint"
    assert item["data"].endswith("Z")

    detalhe = client.get(f"/simulacoes/{sim_id}", headers=auth(token_demo)).json()
    assert detalhe["respostas"] == corpo("P1")
    assert detalhe["resultado"] == recomendar(distros, PERSONAS["P1"]).model_dump(mode="json")


def test_simulacao_inexistente_404(client, token_demo):
    assert client.get("/simulacoes/999999", headers=auth(token_demo)).status_code == 404


def test_isolamento_entre_usuarios(client, token_demo, token_demo2):
    [sim_id] = salvar(client, token_demo, "P1")

    assert client.get(f"/simulacoes/{sim_id}", headers=auth(token_demo2)).status_code == 404
    assert client.get(f"/simulacoes/{sim_id}/sensibilidade", headers=auth(token_demo2)).status_code == 404
    assert client.get("/simulacoes", headers=auth(token_demo2)).json()["total"] == 0
    assert client.get("/dashboard", headers=auth(token_demo2)).json()["total_simulacoes"] == 0


def test_paginacao_e_ordem(client, token_demo):
    p1, p2, p3 = salvar(client, token_demo, "P1", "P2", "P3")

    pag1 = client.get("/simulacoes?pagina=1&por_pagina=2", headers=auth(token_demo)).json()
    assert [i["id"] for i in pag1["itens"]] == [p3, p2]
    assert (pag1["total"], pag1["total_paginas"]) == (3, 2)

    pag2 = client.get("/simulacoes?pagina=2&por_pagina=2", headers=auth(token_demo)).json()
    assert [i["id"] for i in pag2["itens"]] == [p1]

    pag3 = client.get("/simulacoes?pagina=3&por_pagina=2", headers=auth(token_demo)).json()
    assert pag3["itens"] == []


def test_paginacao_parametros_invalidos(client, token_demo):
    assert client.get("/simulacoes?pagina=0", headers=auth(token_demo)).status_code == 422
    assert client.get("/simulacoes?por_pagina=51", headers=auth(token_demo)).status_code == 422


def test_sensibilidade_p1(client, token_demo):
    [sim_id] = salvar(client, token_demo, "P1")
    dados = client.get(f"/simulacoes/{sim_id}/sensibilidade", headers=auth(token_demo)).json()
    assert dados["mesmo_primeiro_grupo"] is True
    assert dados["roc"]["primeiro_grupo"]["nome"] == "Amigáveis base Ubuntu"
    assert dados["roc"]["primeiro_grupo"]["ia"] == pytest.approx(0.9185, abs=1e-3)
    assert dados["iguais"]["primeiro_grupo"]["nome"] == "Amigáveis base Ubuntu"
    assert len(dados["roc"]["grupos"]) == 5


# --- Dashboard -------------------------------------------------------------

def test_dashboard_apos_tres_simulacoes(client, token_demo):
    p1, p2, p3 = salvar(client, token_demo, "P1", "P2", "P3")
    dados = client.get("/dashboard", headers=auth(token_demo)).json()

    assert dados["total_simulacoes"] == 3
    assert dados["simulacoes_mes_atual"] == 3
    assert {p["proposito"]: p["total"] for p in dados["simulacoes_por_proposito"]} == {
        "geral": 2, "jogos": 1, "seguranca": 0, "hardware_antigo": 0,
    }
    assert {d["nome"]: d["vezes"] for d in dados["distros_mais_recomendadas"]} == {
        "Linux Mint": 1, "Manjaro": 1, "Garuda Linux": 1,
    }

    serie = dados["ia_primeiro_grupo_por_simulacao"]
    assert [p["simulacao_id"] for p in serie] == [p1, p2, p3]
    assert [p["grupo"] for p in serie] == ["Amigáveis base Ubuntu", "Família Arch", "Jogos"]
    assert [p["ia"] for p in serie] == pytest.approx([0.9185, 0.9943, 0.811], abs=1e-3)

    ultima = dados["ultima_simulacao"]
    assert ultima["id"] == p3
    assert ultima["perfil"] == "Intermediário · Jogos · Desktop"
    assert ultima["primeiro_grupo"]["nome"] == "Jogos"
    assert ultima["distro_maior_ia"]["nome"] == "Garuda Linux"
    assert dados["ultima_simulacao_em"] == ultima["data"]


def test_dashboard_vazio(client, token_demo2):
    dados = client.get("/dashboard", headers=auth(token_demo2)).json()
    assert dados["total_simulacoes"] == 0
    assert dados["ultima_simulacao"] is None
    assert dados["ultima_simulacao_em"] is None
    assert dados["distros_mais_recomendadas"] == []
    assert all(p["total"] == 0 for p in dados["simulacoes_por_proposito"])


# --- Funções puras de sumarização -------------------------------------------

def test_perfil_resumido():
    assert perfil_resumido(PERSONAS["P1"]) == "Iniciante · Uso geral · Desktop"
    assert perfil_resumido(PERSONAS["P4"]) == "Avançado · Segurança · Desktop"
    assert perfil_resumido(PERSONAS["P6"]) == "Intermediário · Uso geral · Servidor"


def test_simulacoes_mes_atual_com_agora_fixo(distros):
    resultado = recomendar(distros, PERSONAS["P1"])
    datas = [datetime(2026, 5, 31, 23, 59, tzinfo=UTC), datetime(2026, 6, 1, tzinfo=UTC), datetime(2026, 6, 29, tzinfo=UTC)]
    sims = [SimulacaoSalva(id=i, data=d, respostas=PERSONAS["P1"], resultado=resultado) for i, d in enumerate(datas, 1)]
    dados = montar_dashboard(sims, agora=datetime(2026, 6, 30, tzinfo=UTC))
    assert dados.simulacoes_mes_atual == 2
    assert dados.ultima_simulacao_em == datas[-1]
