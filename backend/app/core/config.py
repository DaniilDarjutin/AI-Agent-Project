from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parents[3]
DB_PATH = BASE_DIR / "database" / "app.db"


class Settings(BaseSettings):
    app_name: str = "AI Task Tracker Backend"
    database_url: str = f"sqlite:///{DB_PATH}"
    debug: bool = True

    gigachat_auth_key: str = ""
    gigachat_scope: str = "GIGACHAT_API_PERS"
    gigachat_oauth_url: str = "https://ngw.devices.sberbank.ru:9443/api/v2/oauth"
    gigachat_base_url: str = "https://gigachat.devices.sberbank.ru"
    gigachat_model: str = "GigaChat-2"
    gigachat_verify_ssl: bool = False

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8"
    )

settings = Settings()
