"""Recalcula o agrupamento das distros a partir de dados/ficha_distros_atualizada.xlsx.

Método (docs/definicao-sistema.md, seção 5.1):
  1. Distância de Gower (Gower, 1971) com as 10 variáveis do agrupamento:
       - nominal: 0 se igual, 1 se diferente;
       - lista (valores separados por "|"): 1 - índice de Jaccard;
       - ordinal / numérica: |a - b| / amplitude;
       - valor ausente: a variável é ignorada naquele par.
  2. Agrupamento hierárquico aglomerativo, ligação média (Kaufman & Rousseeuw, 1990).
  3. k entre 3 e 7, escolhido pela maior silhueta média (Rousseeuw, 1987),
     exigindo no mínimo 2 distros por grupo.
  4. Validação: K-Medoids (PAM) com a mesma distância + índice de Rand ajustado.

O script não altera a planilha nem o banco: só imprime o resultado, para comparar
com a coluna `grupo` da ficha, e salva o dendrograma.

Uso (dentro de backend/):
    python scripts/cluster.py [--xlsx caminho.xlsx] [--png caminho.png]
"""

import argparse
import sys
from collections import Counter
from dataclasses import dataclass
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

import numpy as np  # noqa: E402
from scipy.cluster.hierarchy import dendrogram, fcluster, linkage  # noqa: E402
from scipy.spatial.distance import squareform  # noqa: E402
from sklearn.metrics import adjusted_rand_score, silhouette_score  # noqa: E402

from scripts.seed import GRUPO_NOMES, XLSX_PATH, load_distros  # noqa: E402

PNG_PATH = BACKEND_DIR.parent / "docs" / "dendrograma_distros.png"

K_MIN, K_MAX, MIN_PER_GROUP = 3, 7, 2


def _norm(value) -> str | None:
    return None if value is None else str(value).strip().casefold()


def _set(value) -> set[str]:
    """Converte 'a|b|c' em {'a', 'b', 'c'} (após strip e casefold)."""
    return {t.strip().casefold() for t in str(value or "").split("|") if t.strip()}


def _family(value) -> str:
    # "Debian / Ubuntu" -> "debian"; "Red Hat" -> "red" (1ª palavra, como no agrupamento original)
    return _norm((value or "").split("/")[0].split(" ")[0])


COMMERCIAL_SUPPORT = {"nao": 0, "parcial": 1, "sim": 2}

# (nome, tipo, função que extrai o valor da distro)
VARIABLES = [
    ("familia", "nominal", lambda d: _family(d["familia"])),
    ("tarefa_tipo", "lista", lambda d: _set(d["tarefa_tipo"]) or {"geral"}),
    ("ambiente", "lista", lambda d: _set(d["ambiente"])),
    ("modelo_lancamento", "lista", lambda d: _set(d["modelo_lancamento"])),
    ("gerenciador_pacotes", "nominal", lambda d: _norm(d["gerenciador_pacotes"])),
    ("usa_systemd", "nominal", lambda d: "systemd" in _set(d["init"])),
    ("suporte_comercial", "ordinal", lambda d: COMMERCIAL_SUPPORT[_norm(d["suporte_comercial"])]),
    ("suporte_comunidade", "nominal", lambda d: _norm(d["suporte_comunidade"])),
    ("amigabilidade", "ordinal", lambda d: d["amigabilidade"]),
    ("ram_min_gb", "numerica", lambda d: d["ram_min_gb"]),
]
# Retiradas do agrupamento: proposito (redundante com tarefa_tipo),
# disco_min_gb (redundante com RAM e com valores ausentes) e
# arquitetura (pouca variação; já tratada na triagem).


def gower_matrix(distros: list[dict]) -> np.ndarray:
    n = len(distros)
    values = {name: [f(d) for d in distros] for name, _, f in VARIABLES}

    ranges = {}
    for name, kind, _ in VARIABLES:
        if kind in ("ordinal", "numerica"):
            v = [x for x in values[name] if x is not None]
            ranges[name] = (max(v) - min(v)) or 1

    M = np.zeros((n, n))
    for i in range(n):
        for j in range(i + 1, n):
            total, used = 0.0, 0
            for name, kind, _ in VARIABLES:
                a, b = values[name][i], values[name][j]
                if a is None or b is None:
                    continue  # valor ausente: variável ignorada no par
                if kind == "nominal":
                    dist = 0.0 if a == b else 1.0
                elif kind == "lista":
                    dist = 1 - len(a & b) / len(a | b)
                else:
                    dist = abs(a - b) / ranges[name]
                total += dist
                used += 1
            M[i, j] = M[j, i] = total / used
    return M


@dataclass
class KScore:
    k: int
    silhouette: float
    sizes: list[int]
    valid: bool


@dataclass
class Clustering:
    distros: list[dict]
    matrix: np.ndarray
    linkage: np.ndarray
    scores: list[KScore]
    k: int
    silhouette: float
    labels: np.ndarray


def cluster(distros: list[dict]) -> Clustering:
    """Hierárquico com ligação média; k escolhido pela maior silhueta entre os válidos."""
    M = gower_matrix(distros)
    Z = linkage(squareform(M, checks=False), method="average")

    scores, best = [], None
    for k in range(K_MIN, K_MAX + 1):
        labels = fcluster(Z, k, criterion="maxclust")
        sizes = sorted((int(t) for t in np.bincount(labels)[1:]), reverse=True)
        s = float(silhouette_score(M, labels, metric="precomputed"))
        valid = min(sizes) >= MIN_PER_GROUP
        scores.append(KScore(k, s, sizes, valid))
        if valid and (best is None or s > best[1]):
            best = (k, s, labels)

    k, s, labels = best
    return Clustering(distros, M, Z, scores, k, s, labels)


def pam(M: np.ndarray, k: int, attempts: int = 30, seed: int = 0) -> tuple[np.ndarray, list[int]]:
    """K-Medoids (PAM) simples, com várias inicializações aleatórias."""
    n = len(M)
    rng = np.random.default_rng(seed)
    cost = lambda med: M[:, med].min(axis=1).sum()  # noqa: E731
    best = None
    for _ in range(attempts):
        med = list(rng.choice(n, k, replace=False))
        c = cost(med)
        improved = True
        while improved:
            improved = False
            for i in range(k):
                for o in range(n):
                    if o in med:
                        continue
                    trial = med.copy()
                    trial[i] = o
                    ct = cost(trial)
                    if ct < c - 1e-12:
                        med, c, improved = trial, ct, True
        if best is None or c < best[0]:
            best = (c, med)
    return M[:, best[1]].argmin(axis=1), best[1]


def partition(keys: list, labels) -> set[frozenset]:
    """Partição como conjunto de grupos (independe da numeração dos rótulos)."""
    groups: dict = {}
    for key, label in zip(keys, labels):
        groups.setdefault(label, set()).add(key)
    return {frozenset(g) for g in groups.values()}


def _sheet_names(distros: list[dict], labels) -> dict:
    """Identifica cada grupo pelo valor da coluna `grupo` mais frequente entre as suas distros."""
    return {
        g: Counter(d["grupo"] for d, lab in zip(distros, labels) if lab == g).most_common(1)[0][0]
        for g in set(labels)
    }


def save_dendrogram(result: Clustering, path: Path) -> None:
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    Z, k = result.linkage, result.k
    names = [d["nome"] for d in result.distros]
    cut = (Z[-k, 2] + Z[-k + 1, 2]) / 2
    fig, ax = plt.subplots(figsize=(10, 11))
    dendrogram(Z, labels=names, orientation="left", color_threshold=cut, ax=ax)
    ax.axvline(cut, ls="--", color="gray")
    ax.set_xlabel("Distância de Gower (ligação média)")
    ax.set_title(f"Dendrograma das {len(names)} distribuições (corte: k = {k})")
    fig.tight_layout()
    path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(path, dpi=200)
    plt.close(fig)


def print_report(result: Clustering) -> None:
    distros, labels = result.distros, result.labels

    print("Silhueta por k (hierárquico, ligação média):")
    for s in result.scores:
        note = "" if s.valid else "  (descartado: grupo com menos de 2 distros)"
        print(f"  k={s.k}  silhueta={s.silhouette:.4f}  tamanhos={s.sizes}{note}")
    print(f"\nEscolhido k = {result.k} (silhueta = {result.silhouette:.4f})\n")

    print("Grupos (✗ = distro em grupo diferente na coluna `grupo` da ficha):")
    sheet_names = _sheet_names(distros, labels)
    for g in sorted(set(labels), key=lambda g: -int((labels == g).sum())):
        members = [d for d, lab in zip(distros, labels) if lab == g]
        sheet_group = sheet_names[g]
        names = ", ".join(
            d["nome"] + ("" if d["grupo"] == sheet_group else f" ✗ (ficha: {GRUPO_NOMES[d['grupo']]})")
            for d in members
        )
        print(f"  {GRUPO_NOMES[sheet_group]} ({len(members)}): {names}")

    ids = [d["id"] for d in distros]
    same = partition(ids, labels) == partition(ids, [d["grupo"] for d in distros])
    ari_sheet = adjusted_rand_score([d["grupo"] for d in distros], labels)
    print(f"\nComparação com a ficha: Rand ajustado = {ari_sheet:.2f} "
          f"({'mesmos grupos' if same else 'GRUPOS DIFERENTES'})")

    pam_labels, medoids = pam(result.matrix, result.k)
    pam_sil = silhouette_score(result.matrix, pam_labels, metric="precomputed")
    print(f"\nValidação PAM (k={result.k}): silhueta = {pam_sil:.4f}, "
          f"Rand ajustado vs hierárquico = {adjusted_rand_score(labels, pam_labels):.2f}")
    print("  Medoides: " + ", ".join(distros[m]["nome"] for m in medoids))
    names_h, names_p = _sheet_names(distros, labels), _sheet_names(distros, pam_labels)
    for d, h, p in zip(distros, labels, pam_labels):
        if names_h[h] != names_p[p]:
            print(f"  Diferença: {d['nome']} vai para {GRUPO_NOMES[names_p[p]]} no PAM "
                  f"({GRUPO_NOMES[names_h[h]]} no hierárquico)")


def main() -> None:
    parser = argparse.ArgumentParser(description="Recalcula o agrupamento das distros (só imprime).")
    parser.add_argument("--xlsx", type=Path, default=XLSX_PATH, help="planilha de origem")
    parser.add_argument("--png", type=Path, default=PNG_PATH, help="arquivo do dendrograma")
    args = parser.parse_args()

    result = cluster(load_distros(args.xlsx))
    print_report(result)
    save_dendrogram(result, args.png)
    print(f"\nDendrograma salvo em {args.png.resolve()}")


if __name__ == "__main__":
    main()
