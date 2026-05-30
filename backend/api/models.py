"""
Pydantic request / response models for the RepoGenius API.
"""
from pydantic import BaseModel, Field
from typing import Any


# ── Request Models ──────────────────────────────────────────────────────────

class QueryRequest(BaseModel):
    query: str = Field(..., min_length=3, max_length=500, description="Natural language query")
    language: str | None = Field(None, description="Filter by programming language (e.g. 'Python')")
    topics: list[str] | None = Field(None, description="Filter by topic tags")
    n_results: int = Field(20, ge=5, le=50, description="Number of candidates to retrieve")


class IngestRequest(BaseModel):
    queries: list[str] | None = Field(
        None,
        description="Custom search queries. If omitted, uses the configured seed queries.",
    )


# ── Response Models ──────────────────────────────────────────────────────────

class RepoRecommendation(BaseModel):
    full_name: str
    name: str
    description: str
    url: str
    stars: int
    language: str
    topics: list[str]
    relevance_score: float = Field(..., ge=0.0, le=1.0)
    # Per-repo AI insights from Groq LLM
    ai_insight: str = ""
    ai_why_it_fits: str = ""
    ai_suitability: str = ""
    ai_advantages: list[str] = []
    ai_disadvantages: list[str] = []
    ai_best_use_case: str = ""


class AISummary(BaseModel):
    best_for_beginners: str = ""
    best_for_scalability: str = ""
    best_for_learning: str = ""


class QueryResponse(BaseModel):
    query: str
    recommendations: list[RepoRecommendation]
    summary: AISummary = Field(default_factory=AISummary)
    source: str = Field(..., description="'vector_db' or 'auto_ingestion'")
    result_count: int


class IngestResponse(BaseModel):
    status: str
    message: str


class StatusResponse(BaseModel):
    running: bool
    last_run: str | None
    last_run_result: str | None
    repos_added: int
    chunks_added: int
    total_chunks_indexed: int
    error: str | None


class HealthResponse(BaseModel):
    status: str
    db_count: int
    embedding_model: str
    groq_model: str
