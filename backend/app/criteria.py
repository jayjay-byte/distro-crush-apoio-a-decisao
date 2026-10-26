"""Critérios ponderados e pesos ROC (Barron & Barrett, 1996)."""

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
