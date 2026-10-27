"""Validação do modelo pelas 7 personas (CLAUDE.md, "Testes obrigatórios").

Se um teste falhar, o problema está no código, não na expectativa.
"""

import pytest

from app import explain
from app.decision import pesos, ranquear, rotulo
from app.grouping import AVISO_POUCOS_GRUPOS, recomendar
from app.personas import PERSONAS

APPROX = {"abs": 1e-3}

# persona -> (nº de grupos, 1º grupo, IA do 1º grupo, destaques, também compatíveis)
RESULTADO = {
    "P1": (5, "Amigáveis base Ubuntu", 0.9185, [], []),
    "P2": (5, "Família Arch", 0.9943, [], []),
    "P3": (6, "Jogos", 0.811, [], []),
    "P4": (5, "Família Debian", 0.7276, [], []),
    "P5": (5, "Minimalistas", 0.8675, [], [("Arch Linux", 0.174)]),
    "P6": (3, "Generalistas e corporativas", 0.8152, [], []),
    "P7": (2, "Família Debian", 0.4535, [("Tiny Core Linux", 0.721)], [("openSUSE", 0.186)]),
}

# persona -> (compatíveis, distro de maior IA, IA dela)
MOTOR = {
    "P1": (21, "Linux Mint", 1.000),
    "P2": (21, "Manjaro", 1.000),
    "P3": (26, "Garuda Linux", 1.000),
    "P4": (25, "Kali", 1.000),
    "P5": (19, "Puppy Linux", 0.934),
    "P6": (9, "Red Hat", 0.876),
    "P7": (6, "antiX", 0.814),
}


def _por_nome(ranking):
    return {av.distro.nome: av for av in ranking}


def test_soma_pesos_roc_igual_a_1():
    assert sum(pesos().values()) == pytest.approx(1.0)
    assert sum(pesos(iguais=True).values()) == pytest.approx(1.0)


@pytest.mark.parametrize("persona", MOTOR)
def test_motor_compativeis_e_maior_ia(distros, persona):
    compativeis, nome, ia = MOTOR[persona]
    ranking = ranquear(distros, PERSONAS[persona])
    assert len(ranking) == compativeis
    assert ranking[0].distro.nome == nome
    assert ranking[0].ia == pytest.approx(ia, **APPROX)
    assert [av.posicao_geral for av in ranking] == list(range(1, compativeis + 1))


def test_p1_ubuntu_perde_ambiente_grafico(distros):
    ubuntu = _por_nome(ranquear(distros, PERSONAS["P1"]))["Ubuntu"]
    assert sum(c.contribuicao for c in ubuntu.contribuicoes) == pytest.approx(0.972, **APPROX)
    assert ubuntu.peso_respondido == pytest.approx(1.0)
    grafico = next(c for c in ubuntu.contribuicoes if c.criterio == "ambiente_grafico")
    assert grafico.respondido and grafico.nota == 0.0


def test_p1_ordem_de_desempate(distros):
    nomes = [av.distro.nome for av in ranquear(distros, PERSONAS["P1"])]
    assert nomes.index("Linux Mint") < nomes.index("Zorin OS")  # ordem alfabética
    assert nomes.index("Ubuntu") < nomes.index("Lubuntu")  # no_livro


def test_criterio_sem_resposta_sai_do_denominador(distros):
    tiny = _por_nome(ranquear(distros, PERSONAS["P7"]))["Tiny Core Linux"]
    nao_respondidos = [c for c in tiny.contribuicoes if not c.respondido]
    assert {c.criterio for c in nao_respondidos} == {"suporte", "estabilidade", "init", "ambiente_grafico"}
    assert all(c.nota is None and c.contribuicao == 0 for c in nao_respondidos)
    assert tiny.ia == pytest.approx(0.721, **APPROX)


def _isoladas(distros_resultado):
    return [(d.nome, d.ia) for d in distros_resultado]


def _todas(resultado):
    return [
        *resultado.destaques,
        *(d for g in resultado.grupos for d in g.distros),
        *resultado.tambem_compativeis,
    ]


@pytest.mark.parametrize("persona", RESULTADO)
def test_persona_resultado(distros, persona):
    n_grupos, primeiro, ia_primeiro, destaques, tambem = RESULTADO[persona]
    compativeis, maior_nome, maior_ia = MOTOR[persona]
    res = recomendar(distros, PERSONAS[persona])

    assert res.compativeis == compativeis
    assert len(_todas(res)) == compativeis
    assert len(res.grupos) == n_grupos
    assert [g.posicao for g in res.grupos] == list(range(1, n_grupos + 1))
    assert res.grupos[0].nome == primeiro
    assert res.grupos[0].ia == pytest.approx(ia_primeiro, **APPROX)
    assert all(len(g.distros) >= 2 for g in res.grupos)

    maior = max(_todas(res), key=lambda d: d.ia)
    assert maior.nome == maior_nome
    assert maior.ia == pytest.approx(maior_ia, **APPROX)

    assert [n for n, _ in _isoladas(res.destaques)] == [n for n, _ in destaques]
    assert [ia for _, ia in _isoladas(res.destaques)] == pytest.approx([ia for _, ia in destaques], **APPROX)
    assert [n for n, _ in _isoladas(res.tambem_compativeis)] == [n for n, _ in tambem]
    assert [ia for _, ia in _isoladas(res.tambem_compativeis)] == pytest.approx([ia for _, ia in tambem], **APPROX)


@pytest.mark.parametrize("persona", RESULTADO)
def test_sensibilidade_pesos_iguais_mantem_1o_grupo(distros, persona):
    res = recomendar(distros, PERSONAS[persona], pesos_iguais=True)
    assert res.grupos[0].nome == RESULTADO[persona][1]


@pytest.mark.parametrize("persona", RESULTADO)
def test_aviso_de_poucos_grupos(distros, persona):
    res = recomendar(distros, PERSONAS[persona])
    assert (AVISO_POUCOS_GRUPOS in res.avisos) == (persona == "P7")


def test_p1_ubuntu_no_resultado(distros):
    res = recomendar(distros, PERSONAS["P1"])
    assert res.peso_respondido == pytest.approx(1.0)
    ubuntu = next(d for d in _todas(res) if d.nome == "Ubuntu")
    assert sum(c.contribuicao for c in ubuntu.contribuicoes) == pytest.approx(0.972, **APPROX)
    assert ubuntu.ia == pytest.approx(0.972, **APPROX)
    assert ubuntu.rotulo == "Muito alta"
    assert ubuntu.perdeu_pontos == ["Ambiente gráfico (padrão GNOME)"]


def test_p1_ordem_dentro_do_grupo(distros):
    res = recomendar(distros, PERSONAS["P1"])
    nomes = [d.nome for d in res.grupos[0].distros]
    assert nomes == ["Linux Mint", "Zorin OS", "Ubuntu", "Lubuntu", "elementary OS", "Pop!_OS"]


def test_p1_perdeu_pontos_secao_6_2(distros):
    """Conferência com a aba `pesos`, seção 6.2."""
    res = recomendar(distros, PERSONAS["P1"])
    perdeu = {d.nome: d.perdeu_pontos for d in _todas(res)}
    assert perdeu["Linux Mint"] == []
    assert perdeu["Lubuntu"] == ["Ambiente gráfico (padrão LXQt)"]
    assert perdeu["MX Linux"] == ["Usabilidade (nota 2)"]
    assert perdeu["Fedora"] == ["Usabilidade (nota 3)", "Ambiente gráfico (padrão GNOME|KDE Plasma)"]
    assert perdeu["Manjaro"] == ["Usabilidade (nota 2)", "Estabilidade (rolling)"]
    assert perdeu["Arch Linux"][-1] == "Ambiente gráfico (sem padrão, escolha livre)"


def test_perdeu_pontos_suporte_init_e_proposito(distros):
    res = recomendar(distros, PERSONAS["P6"])
    perdeu = {d.nome: d.perdeu_pontos for d in _todas(res)}
    assert "Suporte (pago: parcial)" in perdeu["AlmaLinux"]
    assert "Init (OpenRC|runit|SysV)" in perdeu["Devuan"]
    res = recomendar(distros, PERSONAS["P5"])
    debian = next(d for d in _todas(res) if d.nome == "Debian")
    assert debian.perdeu_pontos[0] == "Propósito (geral)"


def test_avisos_sem_duplicar_requisitos(distros):
    por_id = {d.id: d for d in distros}
    steamos = explain.avisos(por_id["steamos"])
    assert steamos[:2] == [
        "RAM: requisito não informado pelo projeto",
        "Armazenamento: requisito não informado pelo projeto",
    ]
    assert len(steamos) == 3
    assert steamos[2].startswith("Hardware restrito") and steamos[2].endswith("apenas com GPU AMD")
    tails = explain.avisos(por_id["tails"])
    assert tails[0] == "RAM: valor apenas recomendado"
    assert len(tails) == 2 and tails[1].startswith("Sistema live")
    assert explain.avisos(por_id["mint"]) == []


def test_sem_compativeis(distros):
    r = PERSONAS["P1"].model_copy(update={"ambiente": "nuvem", "arquitetura": "i686"})
    res = recomendar(distros, r)
    assert res.compativeis == 0
    assert res.grupos == res.destaques == res.tambem_compativeis == []
    assert res.avisos == [AVISO_POUCOS_GRUPOS]


def test_sem_grupos_isoladas_vao_para_destaques(distros):
    # Devuan e NixOS passam com requisito ausente, cada uma em um grupo diferente.
    r = PERSONAS["P1"].model_copy(update={"ram_gb": 0, "disco_gb": 0, "arquitetura": "arm"})
    res = recomendar(distros, r)
    assert res.grupos == [] and res.tambem_compativeis == []
    assert {d.nome for d in res.destaques} == {"Devuan", "NixOS"}
    assert res.avisos == [AVISO_POUCOS_GRUPOS]


@pytest.mark.parametrize("ia, esperado", [
    (1.0, "Muito alta"), (0.90, "Muito alta"), (0.8999, "Alta"), (0.75, "Alta"),
    (0.7499, "Média"), (0.50, "Média"), (0.4999, "Baixa"), (0.0, "Baixa"),
])
def test_rotulo_pelo_valor_exato(ia, esperado):
    assert rotulo(ia) == esperado
