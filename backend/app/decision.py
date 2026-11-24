"""Motor de decisão: triagem + Índice de Aderência (IA).

Funções puras (sem acesso ao banco): recebem a lista de distros e as respostas.
Especificação: docs/definicao-sistema.md, seção 4.
"""

from dataclasses import dataclass, field

from app.criteria import CRITERIOS, roc_weights
from app.schemas import DistroOut, PesosOrigem, PesosUsuario, Respostas

# Tarefa escolhida na tela -> valores de `tarefa_tipo` que correspondem a ela.
TAREFAS: dict[str, set[str]] = {
    "jogos": {"jogos"},
    "seguranca": {"seguranca_forense", "anonimato", "seguranca_embarcado"},
    "hardware_antigo": {"hardware_antigo"},
}

# Nota de usabilidade por nível de experiência x amigabilidade (1 = mais fácil, 5 = mais difícil).
USABILIDADE: dict[str, dict[int, float]] = {
    "iniciante":     {1: 1.00, 2: 0.75, 3: 0.50, 4: 0.25, 5: 0.00},
    "intermediario": {1: 0.75, 2: 1.00, 3: 1.00, 4: 0.50, 5: 0.25},
    "avancado":      {1: 1.0,  2: 1.0,  3: 1.0,  4: 1.0,  5: 1.0},
}

SUPORTE_COMERCIAL = {"sim": 1.0, "parcial": 0.5, "nao": 0.0}

ROTULOS = [(0.90, "Muito alta"), (0.75, "Alta"), (0.50, "Média")]


def _norm(value: str) -> str:
    return value.strip().casefold()


def _contains(values: list[str], choice: str) -> bool:
    return _norm(choice) in {_norm(v) for v in values}


def pesos(iguais: bool = False) -> dict[str, float]:
    """Pesos ROC por fórmula ou, para a análise de sensibilidade, pesos iguais."""
    n = len(CRITERIOS)
    valores = [1 / n] * n if iguais else roc_weights(n)
    return {cid: peso for (cid, _), peso in zip(CRITERIOS, valores)}


def pesos_do_usuario(notas: PesosUsuario) -> dict[str, float]:
    """Pontuação direta normalizada (SMART, Edwards 1977): peso_k = nota_k / Σ notas."""
    valores = notas.model_dump()
    total = sum(valores.values())  # > 0: garantido pela validação de `Respostas`
    return {cid: valores[cid] / total for cid, _ in CRITERIOS}


def pesos_usados(r: Respostas, pesos_iguais: bool = False) -> tuple[dict[str, float], PesosOrigem]:
    """Pesos da simulação e sua origem: pesos iguais (sensibilidade), do usuário ou ROC."""
    if pesos_iguais:
        return pesos(iguais=True), "iguais"
    if r.pesos is not None:
        return pesos_do_usuario(r.pesos), "usuario"
    return pesos(), "roc"


# --- Fase 1: triagem -------------------------------------------------------

def passa_triagem(distro: DistroOut, r: Respostas) -> bool:
    if distro.ram_min_gb is not None and distro.ram_min_gb > r.ram_gb:
        return False
    if distro.disco_min_gb is not None and distro.disco_min_gb > r.disco_gb:
        return False
    if not _contains(distro.arquitetura, r.arquitetura):
        return False
    if not _contains(distro.ambiente, r.ambiente):
        return False
    if _norm(distro.proposito) == "tarefa":
        return r.tarefa is not None and _atende_tarefa(distro, r.tarefa)
    return True


def triagem(distros: list[DistroOut], r: Respostas) -> list[DistroOut]:
    return [d for d in distros if passa_triagem(d, r)]


def _atende_tarefa(distro: DistroOut, tarefa: str) -> bool:
    return any(_norm(t) in TAREFAS[tarefa] for t in distro.tarefa_tipo)


# --- Fase 2: notas (0 a 1; None = critério não respondido) -----------------

def nota_proposito(distro: DistroOut, r: Respostas) -> float:
    if r.tarefa is None:
        return 1.0 if _norm(distro.proposito) == "geral" else 0.0
    return 1.0 if _atende_tarefa(distro, r.tarefa) else 0.0


def nota_usabilidade(distro: DistroOut, r: Respostas) -> float:
    return USABILIDADE[r.nivel][distro.amigabilidade]


def nota_suporte(distro: DistroOut, r: Respostas) -> float | None:
    if not r.ajuda:
        return None
    notas = []
    if "forum" in r.ajuda:
        notas.append(1.0 if _norm(distro.suporte_comunidade) == "sim" else 0.0)
    if "pago" in r.ajuda:
        notas.append(SUPORTE_COMERCIAL.get(_norm(distro.suporte_comercial), 0.0))
    return sum(notas) / len(notas)


def nota_estabilidade(distro: DistroOut, r: Respostas) -> float | None:
    if r.atualizacoes is None:
        return None
    return 1.0 if _contains(distro.modelo_lancamento, r.atualizacoes) else 0.0


def nota_init(distro: DistroOut, r: Respostas) -> float | None:
    if r.init is None:
        return None
    return 1.0 if _contains(distro.init, r.init) else 0.0


def nota_ambiente_grafico(distro: DistroOut, r: Respostas) -> float | None:
    if r.desktop is None:
        return None
    if _contains(distro.desktop_padrao, r.desktop):
        return 1.0
    if _contains(distro.desktops, r.desktop):
        return 0.5
    return 0.0


NOTAS = {
    "proposito": nota_proposito,
    "usabilidade": nota_usabilidade,
    "suporte": nota_suporte,
    "estabilidade": nota_estabilidade,
    "init": nota_init,
    "ambiente_grafico": nota_ambiente_grafico,
}


# --- IA e ranking ----------------------------------------------------------

@dataclass
class Contribuicao:
    criterio: str
    respondido: bool
    peso: float
    nota: float | None
    contribuicao: float


@dataclass
class Avaliacao:
    distro: DistroOut
    contribuicoes: list[Contribuicao]
    peso_respondido: float
    ia: float
    posicao_geral: int = field(default=0)


def avaliar(distro: DistroOut, r: Respostas, pesos_criterios: dict[str, float]) -> Avaliacao:
    """IA = Σ(peso × nota) / Σ(pesos dos critérios respondidos)."""
    contribuicoes = []
    for cid, _ in CRITERIOS:
        nota = NOTAS[cid](distro, r)
        peso = pesos_criterios[cid]
        contribuicoes.append(Contribuicao(
            criterio=cid,
            respondido=nota is not None,
            peso=peso,
            nota=nota,
            contribuicao=0.0 if nota is None else peso * nota,
        ))
    peso_respondido = sum(c.peso for c in contribuicoes if c.respondido)
    ia = sum(c.contribuicao for c in contribuicoes) / peso_respondido
    return Avaliacao(distro, contribuicoes, peso_respondido, ia)


def chave_desempate(av: Avaliacao) -> tuple:
    """IA decrescente; depois os 4 critérios de desempate; por último, ordem alfabética."""
    d = av.distro
    return (
        -round(av.ia, 9),  # evita que erro de ponto flutuante desfaça um empate real
        d.amigabilidade,
        _norm(d.suporte_comunidade) != "sim",
        _norm(d.no_livro or "") != "sim",
        d.ram_min_gb is None,
        d.ram_min_gb or 0.0,
        d.nome.casefold(),
    )


def ranquear(distros: list[DistroOut], r: Respostas, pesos_iguais: bool = False) -> list[Avaliacao]:
    """Triagem + IA + ordenação. Devolve só as compatíveis, com `posicao_geral` a partir de 1.

    Pesos: iguais se `pesos_iguais`; senão os de `r.pesos`, se houver; senão ROC.
    """
    pesos_criterios, _ = pesos_usados(r, pesos_iguais)
    avaliacoes = sorted(
        (avaliar(d, r, pesos_criterios) for d in triagem(distros, r)),
        key=chave_desempate,
    )
    for posicao, av in enumerate(avaliacoes, start=1):
        av.posicao_geral = posicao
    return avaliacoes


def rotulo(ia: float) -> str:
    """Rótulo pelo valor exato do IA."""
    for limite, nome in ROTULOS:
        if ia >= limite:
            return nome
    return "Baixa"
