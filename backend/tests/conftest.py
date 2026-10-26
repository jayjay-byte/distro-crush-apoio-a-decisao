import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import sessionmaker

from app.db import get_db, make_engine
from app.main import app
from scripts.seed import seed


@pytest.fixture(scope="session")
def engine(tmp_path_factory):
    """Banco temporário semeado a partir da ficha (não usa o distro_crush.db local)."""
    engine = make_engine(tmp_path_factory.mktemp("db") / "test.db")
    seed(engine)
    yield engine
    engine.dispose()


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
