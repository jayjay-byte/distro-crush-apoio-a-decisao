"""Sumarização das simulações salvas: listagem, sensibilidade e Dashboard.

Funções puras (sem acesso ao banco): trabalham sobre as respostas e o snapshot
do resultado já salvos, sem recalcular o motor de decisão.
"""

from collections import Counter
from dataclasses import dataclass
from datetime import datetime

from app.schemas import (
    DashboardOut,
    DistroContagem,
    DistroResultado,
    DistroResumo,
    GrupoRanking,
    GrupoResumo,
    LadoSensibilidade,
    PontoIA,
    PrimeiroGrupoDetalhe,
    PropositoContagem,
    RankingGrupos,
    Respostas,
    Resultado,
    SensibilidadeOut,
    SimulacaoDetalhe,
    SimulacaoResumo,
    UltimaSimulacao,
)

# Rótulos da tela (seção 3 da especificação).
NIVEIS = {"iniciante": "Iniciante", "intermediario": "Intermediário", "avancado": "Avançado"}
PROPOSITOS = {
    "geral": "Uso geral",
    "jogos": "Jogos",
    "seguranca": "Segurança",
    "hardware_antigo": "Hardware antigo",
}
AMBIENTES = {"desktop": "Desktop", "servidor": "Servidor", "nuvem": "Nuvem"}


@dataclass
class SimulacaoSalva:
    id: int
    data: datetime
    respostas: Respostas
    resultado: Resultado


def proposito(r: Respostas) -> str:
    return r.tarefa or "geral"


def perfil_resumido(r: Respostas) -> str:
    """Ex.: "Iniciante · Uso geral · Desktop"."""
    return " · ".join([NIVEIS[r.nivel], PROPOSITOS[proposito(r)], AMBIENTES[r.ambiente]])


def _todas_as_distros(res: Resultado) -> list[DistroResultado]:
    return [*res.destaques, *(d for g in res.grupos for d in g.distros), *res.tambem_compativeis]


def distro_maior_ia(res: Resultado) -> DistroResumo | None:
    """A 1ª colocada geral, que pode estar nos destaques, num grupo ou em também compatíveis."""
    distros = _todas_as_distros(res)
    if not distros:
        return None
    d = min(distros, key=lambda d: d.posicao_geral)
    return DistroResumo(id=d.id, nome=d.nome, ia=d.ia, rotulo=d.rotulo)


def primeiro_grupo(res: Resultado) -> GrupoResumo | None:
    if not res.grupos:
        return None
    g = res.grupos[0]
    return GrupoResumo(nome=g.nome, ia=g.ia, rotulo=g.rotulo)


def resumo(s: SimulacaoSalva) -> SimulacaoResumo:
    return SimulacaoResumo(
        id=s.id,
        data=s.data,
        perfil=perfil_resumido(s.respostas),
        proposito=proposito(s.respostas),
        primeiro_grupo=primeiro_grupo(s.resultado),
        distro_maior_ia=distro_maior_ia(s.resultado),
    )


def detalhe(s: SimulacaoSalva) -> SimulacaoDetalhe:
    return SimulacaoDetalhe(
        id=s.id,
        data=s.data,
        perfil=perfil_resumido(s.respostas),
        respostas=s.respostas,
        resultado=s.resultado,
    )


# --- Sensibilidade ---------------------------------------------------------

def ranking_grupos(res: Resultado) -> RankingGrupos:
    grupos = [
        GrupoRanking(posicao=g.posicao, nome=g.nome, ia=g.ia, rotulo=g.rotulo, distros=len(g.distros))
        for g in res.grupos
    ]
    return RankingGrupos(primeiro_grupo=grupos[0] if grupos else None, grupos=grupos)


ROTULOS_PESOS = {"usuario": "Seus pesos", "roc": "Pesos ROC", "iguais": "Pesos iguais"}


def _nome_primeiro(r: RankingGrupos) -> str | None:
    return r.primeiro_grupo.nome if r.primeiro_grupo else None


def sensibilidade(
    simulacao_id: int,
    roc: Resultado,
    iguais: Resultado,
    usuario: Resultado | None = None,
) -> SensibilidadeOut:
    """Com pesos do usuário: seus pesos × ROC. Sem pesos: ROC × pesos iguais."""
    rankings = {"roc": ranking_grupos(roc), "iguais": ranking_grupos(iguais)}
    if usuario is not None:
        rankings["usuario"] = ranking_grupos(usuario)
        comparacao, chave_principal, chave_alternativo = "usuario_roc", "usuario", "roc"
    else:
        comparacao, chave_principal, chave_alternativo = "roc_iguais", "roc", "iguais"

    principal, alternativo = (
        LadoSensibilidade(chave=chave, rotulo=ROTULOS_PESOS[chave], ranking=rankings[chave])
        for chave in (chave_principal, chave_alternativo)
    )
    return SensibilidadeOut(
        simulacao_id=simulacao_id,
        comparacao=comparacao,
        principal=principal,
        alternativo=alternativo,
        mesmo_primeiro_grupo=_nome_primeiro(principal.ranking) == _nome_primeiro(alternativo.ranking),
        roc=rankings["roc"],
        iguais=rankings["iguais"],
    )


# --- Dashboard -------------------------------------------------------------

def _ultima(s: SimulacaoSalva) -> UltimaSimulacao:
    grupo = None
    if s.resultado.grupos:
        g = s.resultado.grupos[0]
        grupo = PrimeiroGrupoDetalhe(
            nome=g.nome,
            ia=g.ia,
            rotulo=g.rotulo,
            distros=[DistroResumo(id=d.id, nome=d.nome, ia=d.ia, rotulo=d.rotulo) for d in g.distros],
        )
    return UltimaSimulacao(
        id=s.id,
        data=s.data,
        perfil=perfil_resumido(s.respostas),
        ram_gb=s.respostas.ram_gb,
        primeiro_grupo=grupo,
        distro_maior_ia=distro_maior_ia(s.resultado),
    )


def montar_dashboard(simulacoes: list[SimulacaoSalva], agora: datetime) -> DashboardOut:
    """Indicadores do Dashboard. `agora` (UTC) define o mês atual."""
    cronologica = sorted(simulacoes, key=lambda s: (s.data, s.id))

    vencedoras = Counter()
    nomes: dict[str, str] = {}
    for s in cronologica:
        d = distro_maior_ia(s.resultado)
        if d is not None:
            vencedoras[d.id] += 1
            nomes[d.id] = d.nome
    mais_recomendadas = sorted(vencedoras.items(), key=lambda kv: (-kv[1], nomes[kv[0]].casefold()))

    por_proposito = Counter(proposito(s.respostas) for s in cronologica)

    return DashboardOut(
        total_simulacoes=len(cronologica),
        simulacoes_mes_atual=sum(
            1 for s in cronologica if (s.data.year, s.data.month) == (agora.year, agora.month)
        ),
        ultima_simulacao_em=cronologica[-1].data if cronologica else None,
        distros_mais_recomendadas=[
            DistroContagem(id=did, nome=nomes[did], vezes=vezes) for did, vezes in mais_recomendadas
        ],
        simulacoes_por_proposito=[
            PropositoContagem(proposito=pid, rotulo=rotulo, total=por_proposito[pid])
            for pid, rotulo in PROPOSITOS.items()
        ],
        ia_primeiro_grupo_por_simulacao=[
            PontoIA(simulacao_id=s.id, data=s.data, ia=g.ia, rotulo=g.rotulo, grupo=g.nome)
            for s in cronologica
            if (g := primeiro_grupo(s.resultado)) is not None
        ],
        ultima_simulacao=_ultima(cronologica[-1]) if cronologica else None,
    )
