import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session, sessionmaker

from app.db import get_db, make_engine
from app.main import app, fetch_distros
from scripts.seed import seed


@pytest.fixture(scope="session")
def engine(tmp_path_factory):
    """Banco temporário semeado a partir da ficha (não usa o distro_crush.db local)."""
    engine = make_engine(tmp_path_factory.mktemp("db") / "test.db")
    seed(engine)
    yield engine
    engine.dispose()


@pytest.fixture(scope="session")
def distros(engine):
    """Distros do banco de teste, na forma que o motor de decisão recebe."""
    with Session(engine) as db:
        return fetch_distros(db)


@pytest.fixture(scope="session")
def client(engine):
    TestingSession = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)

    def override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def _login(client, login: str) -> str:
    resp = client.post("/auth/login", json={"login": login, "senha": "demo123"})
    assert resp.status_code == 200
    return resp.json()["access_token"]


@pytest.fixture(scope="session")
def token_demo(client):
    return _login(client, "demo")


@pytest.fixture(scope="session")
def token_demo2(client):
    return _login(client, "demo2")
