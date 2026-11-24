"""Montagem do resultado: grupos fixos, destaques e também compatíveis.

Os grupos vêm da coluna `grupo` da ficha e não são recalculados por simulação.
Especificação: docs/definicao-sistema.md, seção 5.3.
"""

from dataclasses import asdict

from app import explain
from app.decision import Avaliacao, pesos_usados, ranquear, rotulo
from app.schemas import DistroOut, DistroResultado, GrupoResultado, PesosOrigem, Respostas, Resultado

MIN_DISTROS_GRUPO = 2
MIN_GRUPOS = 3  # mínimo da faixa 3–7 do agrupamento
AVISO_POUCOS_GRUPOS = "Suas restrições de hardware/ambiente limitaram as opções."


def _distro_resultado(av: Avaliacao, r: Respostas) -> DistroResultado:
    return DistroResultado(
        id=av.distro.id,
        nome=av.distro.nome,
        posicao_geral=av.posicao_geral,
        ia=av.ia,
        rotulo=rotulo(av.ia),
        contribuicoes=[asdict(c) for c in av.contribuicoes],
        perdeu_pontos=explain.perdeu_pontos(av.distro, av.contribuicoes, r),
        avisos=explain.avisos(av.distro),
    )


def montar_resultado(ranking: list[Avaliacao], r: Respostas, pesos_origem: PesosOrigem = "roc") -> Resultado:
    """Recebe as compatíveis já ordenadas (saída de `ranquear`)."""
    por_grupo: dict[str, list[Avaliacao]] = {}
    for av in ranking:
        por_grupo.setdefault(av.distro.grupo, []).append(av)

    formados = [membros for membros in por_grupo.values() if len(membros) >= MIN_DISTROS_GRUPO]
    isoladas = [membros[0] for membros in por_grupo.values() if len(membros) < MIN_DISTROS_GRUPO]

    # IA do grupo decrescente; empate: grupo com a distro mais bem posicionada.
    formados.sort(key=lambda m: (-round(_media(m), 9), m[0].posicao_geral))
    grupos = [
        GrupoResultado(
            posicao=posicao,
            nome=membros[0].distro.grupo_nome,
            ia=_media(membros),
            rotulo=rotulo(_media(membros)),
            distros=[_distro_resultado(av, r) for av in membros],
        )
        for posicao, membros in enumerate(formados, start=1)
    ]

    # Isolada vai para destaque se superar o 1º grupo (ou se não houver grupos).
    ia_primeiro = grupos[0].ia if grupos else None
    destaques, tambem = [], []
    for av in sorted(isoladas, key=lambda a: a.posicao_geral):
        destino = destaques if ia_primeiro is None or av.ia > ia_primeiro else tambem
        destino.append(_distro_resultado(av, r))

    return Resultado(
        compativeis=len(ranking),
        peso_respondido=ranking[0].peso_respondido if ranking else 0.0,
        pesos_origem=pesos_origem,
        destaques=destaques,
        grupos=grupos,
        tambem_compativeis=tambem,
        avisos=[AVISO_POUCOS_GRUPOS] if not ranking or len(grupos) < MIN_GRUPOS else [],
    )


def recomendar(distros: list[DistroOut], r: Respostas, pesos_iguais: bool = False) -> Resultado:
    """Ponto de entrada do motor: triagem, IA, ranking e agrupamento."""
    _, origem = pesos_usados(r, pesos_iguais)
    return montar_resultado(ranquear(distros, r, pesos_iguais), r, origem)


def _media(membros: list[Avaliacao]) -> float:
    return sum(av.ia for av in membros) / len(membros)
