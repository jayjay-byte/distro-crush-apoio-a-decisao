"""Critérios ponderados, pesos ROC (Barron & Barrett, 1996) e pesos sugeridos ao usuário."""

# Ordem de importância da Figura 2-1 do livro (especificação, seção 4.3).
CRITERIOS: list[tuple[str, str]] = [
    ("proposito", "Propósito"),
    ("usabilidade", "Usabilidade"),
    ("suporte", "Suporte"),
    ("estabilidade", "Estabilidade"),
    ("init", "Init"),
    ("ambiente_grafico", "Ambiente gráfico"),
]


def roc_weights(n: int) -> list[float]:
    """w_k = (1/n) × Σ_{i=k..n} 1/i, para k = 1..n."""
    return [sum(1 / i for i in range(k, n + 1)) / n for k in range(1, n + 1)]


def suggested_weights() -> dict[str, int]:
    """Pesos sugeridos na escala de 0 a 10 do usuário: round(10 × w_k / w_1), a partir do ROC.

    Resultado: propósito 10, usabilidade 6, suporte 4, estabilidade 3, init 1, ambiente gráfico 1.
    """
    pesos = roc_weights(len(CRITERIOS))
    return {cid: round(10 * w / pesos[0]) for (cid, _), w in zip(CRITERIOS, pesos)}
