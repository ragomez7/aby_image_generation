from typing import Optional
from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application configuration settings."""
    
    # Application settings
    app_name: str = "ABY Challenge API"
    app_version: str = "1.0.0"
    debug: bool = True
    
    # Server settings
    host: str = "0.0.0.0"
    port: int = 8000
    
    # JWT settings
    secret_key: str = "your-secret-key-change-this-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # API settings
    api_v1_str: str = "/api/v1"
    
    # Replicate API settings
    replicate_api_token: str = Field(alias="REPLICATE_API_TOKEN", description="Replicate API token from REPLICATE_API_TOKEN env variable")
    replicate_model: str = "black-forest-labs/flux-schnell"
    
    # Database settings
    database_host: str = "34.30.210.111"
    database_port: int = 5432
    database_user: str = "postgres"
    database_password: str = Field(alias="POSTGRES_PASSWORD", description="Database password from POSTGRES_PASSWORD env variable")
    database_name: str = "postgres"
    
    @property
    def database_url(self) -> str:
        """Construct database URL from components."""
        return f"postgresql+asyncpg://{self.database_user}:{self.database_password}@{self.database_host}:{self.database_port}/{self.database_name}"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()
