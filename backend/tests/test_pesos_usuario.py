"""Pesos definidos pelo usuário (pontuação direta normalizada, SMART) e pesos sugeridos.

Sem `pesos`, o comportamento é o mesmo de antes (ROC): coberto por test_personas.py e test_api.py.
"""

import pytest
from pydantic import ValidationError
from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.criteria import CRITERIOS, roc_weights, suggested_weights
from app.decision import nota_proposito, pesos_usados, ranquear
from app.grouping import recomendar
from app.models import Result, Simulation
from app.personas import PERSONAS
from app.schemas import MSG_PESOS_ZERADOS, PesosUsuario, Respostas

APPROX = {"abs": 1e-3}

SUGERIDOS = {"proposito": 10, "usabilidade": 6, "suporte": 4, "estabilidade": 3, "init": 1, "ambiente_grafico": 1}
IGUAIS_5 = dict.fromkeys(SUGERIDOS, 5)
SO_PROPOSITO = {**dict.fromkeys(SUGERIDOS, 0), "proposito": 10}


def auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def com_pesos(persona: str, pesos: dict | None) -> Respostas:
    return PERSONAS[persona].model_copy(update={"pesos": PesosUsuario(**pesos) if pesos else None})


def corpo(persona: str, pesos: dict | None = None) -> dict:
    return {**PERSONAS[persona].model_dump(mode="json"), "pesos": pesos}


def sem_origem(resultado) -> dict:
    return resultado.model_dump(mode="json", exclude={"pesos_origem"})


@pytest.fixture(autouse=True)
def banco_limpo(engine):
    with Session(engine) as db:
        db.execute(delete(Result))
        db.execute(delete(Simulation))
        db.commit()


# --- Pesos sugeridos -------------------------------------------------------

def test_pesos_sugeridos_pela_formula():
    w = roc_weights(len(CRITERIOS))
    assert suggested_weights() == SUGERIDOS
    assert suggested_weights() == {cid: round(10 * wk / w[0]) for (cid, _), wk in zip(CRITERIOS, w)}


def test_get_criterios_devolve_pesos_sugeridos_sem_remover_campos(client):
    criterios = client.get("/criterios").json()
    assert [c["peso_sugerido"] for c in criterios] == [10, 6, 4, 3, 1, 1]
    assert [c["id"] for c in criterios] == list(SUGERIDOS)
    assert all({"id", "nome", "ordem", "peso"} <= c.keys() for c in criterios)


# --- Motor -----------------------------------------------------------------

def test_sem_pesos_usa_roc_e_origem_roc(distros):
    pesos, origem = pesos_usados(PERSONAS["P1"])
    assert origem == "roc"
    assert list(pesos.values()) == roc_weights(6)
    assert recomendar(distros, PERSONAS["P1"]).pesos_origem == "roc"
    assert recomendar(distros, PERSONAS["P1"], pesos_iguais=True).pesos_origem == "iguais"


def test_pesos_do_usuario_normalizados(distros):
    pesos, origem = pesos_usados(com_pesos("P1", SUGERIDOS))
    assert origem == "usuario"
    assert pesos == pytest.approx({cid: nota / 25 for cid, nota in SUGERIDOS.items()})
    assert sum(pesos.values()) == pytest.approx(1.0)

    res = recomendar(distros, com_pesos("P1", SUGERIDOS))
    assert res.pesos_origem == "usuario"
    # as contribuições mostram o peso efetivamente usado
    contrib = res.grupos[0].distros[0].contribuicoes
    assert [c.peso for c in contrib] == pytest.approx([nota / 25 for nota in SUGERIDOS.values()])


def test_p1_notas_iguais_a_5_igual_a_pesos_iguais(distros):
    usuario = recomendar(distros, com_pesos("P1", IGUAIS_5))
    iguais = recomendar(distros, PERSONAS["P1"], pesos_iguais=True)
    assert usuario.pesos_origem == "usuario"
    assert sem_origem(usuario) == sem_origem(iguais)


def test_p1_so_proposito_ia_igual_a_nota_de_proposito(distros):
    r = com_pesos("P1", SO_PROPOSITO)
    ranking = ranquear(distros, r)
    assert len(ranking) == 21
    for av in ranking:
        assert av.ia == pytest.approx(nota_proposito(av.distro, r), **APPROX)
        assert av.peso_respondido == pytest.approx(1.0)


def test_criterio_sem_resposta_continua_fora_do_denominador(distros):
    # P4 não responde estabilidade, init nem ambiente gráfico: só propósito, usabilidade e suporte contam.
    r = com_pesos("P4", SUGERIDOS)
    primeira = ranquear(distros, r)[0]
    assert primeira.peso_respondido == pytest.approx((10 + 6 + 4) / 25)
    nao_respondidos = [c for c in primeira.contribuicoes if not c.respondido]
    assert {c.criterio for c in nao_respondidos} == {"estabilidade", "init", "ambiente_grafico"}
    assert all(c.contribuicao == 0 for c in nao_respondidos)


def test_peso_zero_so_nos_criterios_nao_respondidos_e_valido(distros):
    # P4 não responde init: peso 0 nele (e > 0 no resto) não é erro.
    r = com_pesos("P4", {**SO_PROPOSITO, "init": 0})
    assert recomendar(distros, r).compativeis == 25


# --- Validação (422) -------------------------------------------------------

@pytest.mark.parametrize("pesos", [
    dict.fromkeys(SUGERIDOS, 0),  # todas em 0
    {**SUGERIDOS, "proposito": 11},  # acima de 10
    {**SUGERIDOS, "suporte": -1},  # abaixo de 0
    {**SUGERIDOS, "usabilidade": 2.5},  # não inteira
    {**SUGERIDOS, "init": "5"},  # texto
    {k: v for k, v in SUGERIDOS.items() if k != "ambiente_grafico"},  # chave faltando
    {**SUGERIDOS, "ram": 5},  # chave desconhecida (RAM é só triagem)
])
@pytest.mark.parametrize("rota", ["/recomendacao", "/simulacoes"])
def test_pesos_invalidos_422(client, token_demo, rota, pesos):
    resp = client.post(rota, json=corpo("P1", pesos), headers=auth(token_demo))
    assert resp.status_code == 422


def test_soma_zero_nos_respondidos_422_com_mensagem(client, token_demo):
    # P4 só responde propósito, usabilidade e suporte; peso só em init (não respondido) soma 0.
    pesos = {**dict.fromkeys(SUGERIDOS, 0), "init": 10}
    for p, ps in [("P1", dict.fromkeys(SUGERIDOS, 0)), ("P4", pesos)]:
        resp = client.post("/recomendacao", json=corpo(p, ps), headers=auth(token_demo))
        assert resp.status_code == 422
        assert resp.json()["detail"][0]["msg"] == MSG_PESOS_ZERADOS

    with pytest.raises(ValidationError, match=MSG_PESOS_ZERADOS):
        Respostas.model_validate({**corpo("P4"), "pesos": pesos})


def test_pesos_com_pesos_iguais_422(client, token_demo):
    resp = client.post("/recomendacao?pesos=iguais", json=corpo("P1", SUGERIDOS), headers=auth(token_demo))
    assert resp.status_code == 422


def test_recomendacao_com_pesos(client, token_demo, distros):
    resp = client.post("/recomendacao", json=corpo("P1", SUGERIDOS), headers=auth(token_demo))
    assert resp.status_code == 200
    dados = resp.json()
    assert dados["pesos_origem"] == "usuario"
    assert dados == recomendar(distros, com_pesos("P1", SUGERIDOS)).model_dump(mode="json")


def test_pesos_null_igual_a_ausente(client, token_demo):
    com_null = client.post("/recomendacao", json=corpo("P1", None), headers=auth(token_demo)).json()
    sem_campo = {k: v for k, v in corpo("P1").items() if k != "pesos"}
    ausente = client.post("/recomendacao", json=sem_campo, headers=auth(token_demo)).json()
    assert com_null == ausente
    assert com_null["pesos_origem"] == "roc"


# --- Simulações salvas e sensibilidade -------------------------------------

def test_simulacao_com_pesos_salva_devolve_e_compara_com_roc(client, token_demo, distros, engine):
    resp = client.post("/simulacoes", json=corpo("P1", SO_PROPOSITO), headers=auth(token_demo))
    assert resp.status_code == 201
    sim_id = resp.json()["id"]

    with Session(engine) as db:
        sim = db.get(Simulation, sim_id)
        assert sim.pesos == SO_PROPOSITO
        assert "pesos" not in sim.respostas

    detalhe = client.get(f"/simulacoes/{sim_id}", headers=auth(token_demo)).json()
    assert detalhe["respostas"]["pesos"] == SO_PROPOSITO
    assert detalhe["resultado"]["pesos_origem"] == "usuario"
    assert detalhe["resultado"] == recomendar(distros, com_pesos("P1", SO_PROPOSITO)).model_dump(mode="json")

    sens = client.get(f"/simulacoes/{sim_id}/sensibilidade", headers=auth(token_demo)).json()
    assert sens["comparacao"] == "usuario_roc"
    assert (sens["principal"]["chave"], sens["principal"]["rotulo"]) == ("usuario", "Seus pesos")
    assert (sens["alternativo"]["chave"], sens["alternativo"]["rotulo"]) == ("roc", "Pesos ROC")
    assert sens["alternativo"]["ranking"] == sens["roc"]
    assert sens["roc"]["primeiro_grupo"]["nome"] == "Amigáveis base Ubuntu"
    assert sens["roc"]["primeiro_grupo"]["ia"] == pytest.approx(0.9185, **APPROX)
    usuario = recomendar(distros, com_pesos("P1", SO_PROPOSITO))
    assert sens["principal"]["ranking"]["primeiro_grupo"]["nome"] == usuario.grupos[0].nome
    assert sens["mesmo_primeiro_grupo"] == (usuario.grupos[0].nome == "Amigáveis base Ubuntu")
    # formato anterior mantido
    assert sens["iguais"]["primeiro_grupo"]["nome"] == "Amigáveis base Ubuntu"


def test_simulacao_sem_pesos_compara_roc_com_iguais(client, token_demo):
    resp = client.post("/simulacoes", json=corpo("P1"), headers=auth(token_demo))
    sim_id = resp.json()["id"]

    detalhe = client.get(f"/simulacoes/{sim_id}", headers=auth(token_demo)).json()
    assert detalhe["respostas"]["pesos"] is None
    assert detalhe["resultado"]["pesos_origem"] == "roc"

    sens = client.get(f"/simulacoes/{sim_id}/sensibilidade", headers=auth(token_demo)).json()
    assert sens["comparacao"] == "roc_iguais"
    assert (sens["principal"]["chave"], sens["principal"]["rotulo"]) == ("roc", "Pesos ROC")
    assert (sens["alternativo"]["chave"], sens["alternativo"]["rotulo"]) == ("iguais", "Pesos iguais")
    assert sens["principal"]["ranking"] == sens["roc"]
    assert sens["alternativo"]["ranking"] == sens["iguais"]
    assert sens["mesmo_primeiro_grupo"] is True


def test_snapshot_antigo_sem_pesos_origem_continua_valido(client, token_demo, engine):
    # Simulação gravada antes da mudança: sem `pesos_origem` no snapshot.
    sim_id = client.post("/simulacoes", json=corpo("P1"), headers=auth(token_demo)).json()["id"]
    with Session(engine) as db:
        res = db.query(Result).filter_by(simulacao_id=sim_id).one()
        res.dados = {k: v for k, v in res.dados.items() if k != "pesos_origem"}
        db.commit()
    detalhe = client.get(f"/simulacoes/{sim_id}", headers=auth(token_demo))
    assert detalhe.status_code == 200
    assert detalhe.json()["resultado"]["pesos_origem"] == "roc"
