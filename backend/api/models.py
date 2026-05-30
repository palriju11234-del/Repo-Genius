"""
Pydantic request / response models for the RepoGenius API.
"""
from pydantic import BaseModel, Field
from typing import Any, Literal


# ── Request Models ──────────────────────────────────────────────────────────

class QueryRequest(BaseModel):
    query: str = Field(..., min_length=3, max_length=500, description="Natural language query")
    language: str | None = Field(None, description="Filter by programming language (e.g. 'Python')")
    topics: list[str] | None = Field(None, description="Filter by topic tags")
    n_results: int = Field(20, ge=5, le=50, description="Number of candidates to retrieve")


class UserProfile(BaseModel):
    """Developer profile collected during Chrome Extension onboarding."""
    experience: Literal["beginner", "intermediate", "advanced", "professional"] = "intermediate"
    goal: Literal["learning", "building", "hackathons", "open_source", "production", "research"] = "building"
    language: str = "Python"  # Primary preferred language
    languages: list[str] = []  # All preferred languages
    complexity: Literal["simple", "moderate", "advanced"] = "moderate"
    project_types: list[str] = []  # e.g. ["Web Development", "AI / ML"]


class PersonalizedQueryRequest(BaseModel):
    """Request model for the personalized ranking endpoint."""
    query: str = Field(..., min_length=3, max_length=500)
    user_profile: UserProfile
    n_results: int = Field(20, ge=5, le=50)
    interaction_history: list[str] = Field(
        default=[],
        description="List of repo full_names the user has previously interacted with",
    )


class InteractionRequest(BaseModel):
    """Fired by the extension when a user views, stars, or saves a repo."""
    repo: str = Field(..., description="full_name of the repository, e.g. 'owner/repo'")
    action: Literal["viewed", "starred", "saved"]
    query: str = Field("", description="The search query that led to this interaction")


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
    ai_brief_description: str = ""  # Short plain-English summary for extension card
    ai_insight: str = ""
    ai_why_it_fits: str = ""
    ai_suitability: str = ""
    ai_advantages: list[str] = []
    ai_disadvantages: list[str] = []
    ai_best_use_case: str = ""


class ScoreBreakdown(BaseModel):
    """Detailed score breakdown for explainability."""
    semantic_similarity: float = 0.0
    experience_match: float = 0.0
    complexity_fit: float = 0.0
    repo_quality: float = 0.0
    doc_quality: float = 0.0
    final_score: float = 0.0


class PersonalizedRepoRecommendation(RepoRecommendation):
    """RepoRecommendation enriched with personalization data."""
    personalized_score: float = Field(0.0, ge=0.0, le=1.0)
    score_breakdown: ScoreBreakdown = Field(default_factory=ScoreBreakdown)
    explanation_reasons: list[str] = []  # e.g. ["✓ Matches Python preference", ...]
    rank: int = 0


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


class PersonalizedQueryResponse(BaseModel):
    query: str
    recommendations: list[PersonalizedRepoRecommendation]
    summary: AISummary = Field(default_factory=AISummary)
    source: str
    result_count: int
    profile_summary: str = ""  # e.g. "Beginner Python Developer"


class InteractionResponse(BaseModel):
    status: str
    message: str


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
