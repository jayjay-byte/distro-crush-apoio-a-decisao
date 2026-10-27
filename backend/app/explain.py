"""Textos de explicação por distro: "onde perdeu pontos" e avisos.

Formato de "perdeu pontos": "Critério (valor da distro)", como na aba `pesos`,
seção 6.2 (ex.: "Usabilidade (nota 2)", "Ambiente gráfico (padrão GNOME)").
"""

from app.schemas import DistroOut, Respostas

NOMES = {
    "proposito": "Propósito",
    "usabilidade": "Usabilidade",
    "suporte": "Suporte",
    "estabilidade": "Estabilidade",
    "init": "Init",
    "ambiente_grafico": "Ambiente gráfico",
}

# Valores sim/parcial/nao da ficha, com acento para exibição.
EXIBICAO = {"sim": "sim", "parcial": "parcial", "nao": "não"}

# Trechos da coluna `aviso` que já são gerados a partir dos campos de requisito.
PREFIXOS_REQUISITO = ("requisito de", "ram:", "armazenamento:")


def _exibir(value: str) -> str:
    return EXIBICAO.get(value.strip().casefold(), value)


def _detalhe(criterio: str, distro: DistroOut, r: Respostas) -> str:
    if criterio == "proposito":
        if distro.proposito.strip().casefold() == "tarefa":
            return f"tarefa {'|'.join(distro.tarefa_tipo)}"
        return distro.proposito
    if criterio == "usabilidade":
        return f"nota {distro.amigabilidade}"
    if criterio == "suporte":
        partes = []
        if "forum" in (r.ajuda or []) and distro.suporte_comunidade.strip().casefold() != "sim":
            partes.append(f"fórum: {_exibir(distro.suporte_comunidade)}")
        if "pago" in (r.ajuda or []) and distro.suporte_comercial.strip().casefold() != "sim":
            partes.append(f"pago: {_exibir(distro.suporte_comercial)}")
        return "; ".join(partes)
    if criterio == "estabilidade":
        return "|".join(distro.modelo_lancamento)
    if criterio == "init":
        return "|".join(distro.init)
    # A ficha usa "nenhum (escolha livre)" quando a distro não traz ambiente padrão.
    if any(d.strip().casefold().startswith("nenhum") for d in distro.desktop_padrao):
        return "sem padrão, escolha livre"
    return f"padrão {'|'.join(distro.desktop_padrao)}"


def perdeu_pontos(distro: DistroOut, contribuicoes, r: Respostas) -> list[str]:
    """Critérios respondidos com nota < 1, na ordem de importância."""
    return [
        f"{NOMES[c.criterio]} ({_detalhe(c.criterio, distro, r)})"
        for c in contribuicoes
        if c.respondido and c.nota < 1
    ]


def avisos(distro: DistroOut) -> list[str]:
    resultado = []
    for rotulo, minimo, tipo in (
        ("RAM", distro.ram_min_gb, distro.req_tipo_ram),
        ("Armazenamento", distro.disco_min_gb, distro.req_tipo_disco),
    ):
        if minimo is None:
            resultado.append(f"{rotulo}: requisito não informado pelo projeto")
        elif (tipo or "").strip().casefold() == "recomendado":
            resultado.append(f"{rotulo}: valor apenas recomendado")
    # Da coluna `aviso`, só o que não é requisito (sistema live, hardware restrito).
    trechos: list[str] = []
    for parte in (distro.aviso or "").split(";"):
        parte = parte.strip()
        if not parte:
            continue
        if trechos and parte[0].islower():
            trechos[-1] += f"; {parte}"  # continuação da frase anterior
        else:
            trechos.append(parte)
    resultado.extend(t for t in trechos if not t.casefold().startswith(PREFIXOS_REQUISITO))
    return resultado
