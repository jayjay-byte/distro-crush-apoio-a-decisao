"""Respostas das 7 personas de validação (especificação, seção 8; aba `pesos`, seção 6).

Os valores esperados de cada persona ficam em `tests/test_personas.py`.
"""

from app.schemas import Respostas

PERSONAS: dict[str, Respostas] = {
    "P1": Respostas(
        tarefa=None, ambiente="desktop", ajuda=["forum"], nivel="iniciante",
        ram_gb=8, disco_gb=128, arquitetura="x86_64",
        atualizacoes="padrao", desktop="Xfce", init="systemd",
    ),
    "P2": Respostas(
        tarefa=None, ambiente="desktop", ajuda=None, nivel="avancado",
        ram_gb=16, disco_gb=256, arquitetura="x86_64",
        atualizacoes="rolling", desktop="KDE Plasma", init="systemd",
    ),
    "P3": Respostas(
        tarefa="jogos", ambiente="desktop", ajuda=["forum"], nivel="intermediario",
        ram_gb=16, disco_gb=512, arquitetura="x86_64",
        atualizacoes=None, desktop="KDE Plasma", init=None,
    ),
    "P4": Respostas(
        tarefa="seguranca", ambiente="desktop", ajuda=["forum"], nivel="avancado",
        ram_gb=8, disco_gb=128, arquitetura="x86_64",
        atualizacoes=None, desktop=None, init=None,
    ),
    "P5": Respostas(
        tarefa="hardware_antigo", ambiente="desktop", ajuda=["forum"], nivel="iniciante",
        ram_gb=2, disco_gb=32, arquitetura="x86_64",
        atualizacoes="padrao", desktop=None, init=None,
    ),
    "P6": Respostas(
        tarefa=None, ambiente="servidor", ajuda=["pago"], nivel="intermediario",
        ram_gb=4, disco_gb=64, arquitetura="x86_64",
        atualizacoes="padrao", desktop=None, init="systemd",
    ),
    "P7": Respostas(
        tarefa="hardware_antigo", ambiente="desktop", ajuda=None, nivel="iniciante",
        ram_gb=1, disco_gb=16, arquitetura="i686",
        atualizacoes=None, desktop=None, init=None,
    ),
}
