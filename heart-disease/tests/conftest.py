import os
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

# Test-time environment defaults must be set before app modules import auth settings.
os.environ.setdefault('SECRET_KEY', 'test-secret-key')
os.environ.setdefault('ENVIRONMENT', 'development')
os.environ.setdefault('DATABASE_URL', 'sqlite:///./test_cardiosense.db')
os.environ.setdefault('AUTO_CREATE_TABLES', 'false')

import src.api.app as api_module
from src.db.database import Base, SessionLocal, engine, get_db


def _stub_model_data() -> dict:
    return {
        'model': object(),
        'feature_cols': [],
        'feature_importances': {},
        'feature_stats': {},
        'metrics': {},
        'model_type': 'test-stub',
    }


api_module.load_model = _stub_model_data  # type: ignore[assignment]


@pytest.fixture(scope='function')
def db_session() -> Generator[Session, None, None]:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(scope='function')
def client(db_session: Session) -> Generator[TestClient, None, None]:
    def override_get_db() -> Generator[Session, None, None]:
        yield db_session

    api_module.app.dependency_overrides[get_db] = override_get_db
    with TestClient(api_module.app) as test_client:
        yield test_client
    api_module.app.dependency_overrides.clear()
