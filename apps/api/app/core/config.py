from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    ENV: str = "development"
    DATABASE_URL: str = (
        "postgresql+asyncpg://tradebridge:tradebridge_dev_pw@localhost:5432/tradebridge"
    )
    JWT_SECRET: str = "dev-only-secret-change-me"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    @property
    def is_dev(self) -> bool:
        return self.ENV == "development"


@lru_cache
def get_settings() -> Settings:
    return Settings()
