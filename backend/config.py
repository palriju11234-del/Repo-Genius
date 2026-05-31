"""
RepoGenius — Centralized Configuration
"""
from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    # GitHub
    github_token: str = ""

    # Groq LLM
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"

    # Quality filter
    min_stars: int = 50
    min_forks: int = 0
    max_inactivity_days: int = 730

    # ChromaDB
    chroma_db_path: str = "./chroma_db"

    # Embedding
    embedding_model: str = "all-MiniLM-L6-v2"

    # RAG sufficiency
    min_results: int = 5
    max_distance: float = 0.55

    # Scheduler
    ingestion_interval_hours: int = 24
    cleanup_interval_hours: int = 48
    max_repo_age_hours: int = 48

    # OAuth — Google
    google_client_id: str = ""
    google_client_secret: str = ""

    # OAuth — GitHub (OAuth App, separate from PAT)
    github_client_id: str = ""
    github_client_secret: str = ""

    # Session JWT
    jwt_secret: str = "changeme-replace-this-with-a-secure-random-secret"

    # Frontend origin (used for post-OAuth redirect)
    frontend_url: str = "http://localhost:5173"

    # Backend origin (used to build OAuth redirect URIs — must match registered callback URLs exactly)
    backend_url: str = "http://127.0.0.1:8000"

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    # Default seed queries for scheduled ingestion
    seed_queries: list = [
        "machine learning python library",
        "web framework javascript",
        "cli tool rust",
        "data visualization python",
        "REST API framework",
        "database ORM python",
        "react component library",
        "docker kubernetes devops",
        "natural language processing NLP",
        "computer vision deep learning",
    ]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()
BASE_DIR = Path(__file__).parent
