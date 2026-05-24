from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

from ..core.config import settings

# DATABASE_URL이 비어있어도 import 단계에서 에러가 나지 않도록 처리.
# 실제 요청 시점에 연결 시도가 이뤄지므로, DB 없이 앱 기동 및 /health 체크는 가능.
_engine = None
_SessionLocal = None


def get_engine():
    global _engine
    if _engine is None and settings.DATABASE_URL:
        _engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
    return _engine


def get_session_factory():
    global _SessionLocal
    engine = get_engine()
    if _SessionLocal is None and engine is not None:
        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return _SessionLocal


def get_db() -> Generator[Session, None, None]:
    factory = get_session_factory()
    if factory is None:
        raise RuntimeError("DATABASE_URL이 설정되지 않았습니다.")
    db = factory()
    try:
        yield db
    finally:
        db.close()
