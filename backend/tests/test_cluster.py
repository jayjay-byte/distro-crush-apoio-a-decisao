import pytest

from scripts.cluster import cluster, partition
from scripts.seed import XLSX_PATH, load_distros


@pytest.fixture(scope="module")
def resultado():
    return cluster(load_distros(XLSX_PATH))


def test_k_7(resultado):
    assert resultado.k == 7


def test_silhueta(resultado):
    assert resultado.silhouette == pytest.approx(0.384, abs=0.005)


def test_mesmos_grupos_da_ficha(resultado):
    """Mesma partição da coluna `grupo`, sem depender da numeração dos grupos."""
    ids = [d["id"] for d in resultado.distros]
    ficha = [d["grupo"] for d in resultado.distros]
    assert partition(ids, resultado.labels) == partition(ids, ficha)
