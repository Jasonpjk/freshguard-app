import os
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

# Alembic Config object
config = context.config

# DATABASE_URL을 환경변수에서 읽어 alembic.ini의 %(DATABASE_URL)s를 채움
# Railway는 postgres:// 형식 제공 → postgresql:// 로 자동 변환
_raw_url = os.environ.get("DATABASE_URL", "")
if _raw_url.startswith("postgres://"):
    _raw_url = "postgresql://" + _raw_url[len("postgres://"):]
config.set_main_option("DATABASE_URL", _raw_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# 모든 모델을 import해서 autogenerate가 정상 동작하도록
from app.db.base import Base  # noqa: E402
import app.models  # noqa: E402, F401

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
