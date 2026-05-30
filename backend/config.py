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
