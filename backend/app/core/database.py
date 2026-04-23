from pathlib import Path

from sqlalchemy import inspect, text
from sqlmodel import SQLModel, Session, create_engine
from app.core.config import settings

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
    _ensure_chat_state_columns()

def get_session():
    with Session(engine) as session:
        yield session


def _ensure_chat_state_columns():
    inspector = inspect(engine)
    table_name = "chatstate"

    if table_name not in inspector.get_table_names():
        return

    existing_columns = {
        column["name"]
        for column in inspector.get_columns(table_name)
    }

    statements = []

    if "last_task_id" not in existing_columns:
        statements.append(f"ALTER TABLE {table_name} ADD COLUMN last_task_id INTEGER")

    if "last_task_title" not in existing_columns:
        statements.append(f"ALTER TABLE {table_name} ADD COLUMN last_task_title VARCHAR")

    if not statements:
        return

    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))


def _ensure_sqlite_directory(database_url: str):
    sqlite_prefix = "sqlite:///"

    if not database_url.startswith(sqlite_prefix):
        return

    database_path = database_url.removeprefix(sqlite_prefix)
    if not database_path or database_path == ":memory:":
        return

    path = Path(database_path)
    path.parent.mkdir(parents=True, exist_ok=True)


_ensure_sqlite_directory(settings.database_url)

engine = create_engine(
    settings.database_url,
    echo=True,
    connect_args={"check_same_thread": False}
)
