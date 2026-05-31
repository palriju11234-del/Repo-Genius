"""
API routes — /api/query, /api/ingest, /api/status, /api/health
"""
import logging

from fastapi import APIRouter, HTTPException, BackgroundTasks

from backend.api.models import (
    QueryRequest, QueryResponse,
    IngestRequest, IngestResponse,
    StatusResponse, HealthResponse,
    RepoRecommendation, AISummary,
)
from backend.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api")


# ── Health ───────────────────────────────────────────────────────────────────

@router.get("/health", response_model=HealthResponse, tags=["System"])
def health():
    """Liveness check — returns DB size and model info."""
    from backend.ingestion.vector_store import get_vector_store
    store = get_vector_store()
    return HealthResponse(
        status="ok",
        db_count=store.count(),
        embedding_model=settings.embedding_model,
        groq_model=settings.groq_model,
    )


# ── Status ───────────────────────────────────────────────────────────────────

@router.get("/status", response_model=StatusResponse, tags=["System"])
def status():
    """Returns current ingestion status and vector DB statistics."""
    from backend.ingestion.scheduler import ingestion_status
    from backend.ingestion.vector_store import get_vector_store
    store = get_vector_store()
    return StatusResponse(
        running=ingestion_status.get("running", False),
        last_run=ingestion_status.get("last_run"),
        last_run_result=ingestion_status.get("last_run_result"),
        repos_added=ingestion_status.get("repos_added", 0),
        chunks_added=ingestion_status.get("chunks_added", 0),
        total_chunks_indexed=store.count(),
        error=ingestion_status.get("error"),
    )


# ── Query ────────────────────────────────────────────────────────────────────

@router.post("/query", response_model=QueryResponse, tags=["Query"])
def query_repos(req: QueryRequest):
    """
    Submit a natural language query and receive AI-powered repository recommendations.
    """
    clean_query = req.query.strip()
    if not clean_query:
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
    
    words = clean_query.split()
    if len(words) == 1:
        raise HTTPException(
            status_code=400,
            detail="Explain your query in two or more words."
        )

    try:
        from backend.query.rag_engine import get_rag_engine
        engine = get_rag_engine()
        result = engine.query(
            query=req.query,
            language=req.language,
            topics=req.topics,
            n_results=req.n_results,
        )

        recommendations = [
            RepoRecommendation(**r) for r in result["recommendations"]
        ]

        summary_data = result.get("summary", {})
        summary = AISummary(
            best_for_beginners=summary_data.get("best_for_beginners", ""),
            best_for_scalability=summary_data.get("best_for_scalability", ""),
            best_for_learning=summary_data.get("best_for_learning", ""),
        )

        return QueryResponse(
            query=result["query"],
            recommendations=recommendations,
            summary=summary,
            source=result["source"],
            result_count=result["result_count"],
        )
    except Exception as e:
        logger.exception(f"Query failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Ingest ───────────────────────────────────────────────────────────────────

@router.post("/ingest", response_model=IngestResponse, tags=["Ingestion"])
def ingest(req: IngestRequest, background_tasks: BackgroundTasks):
    """
    Manually trigger repository ingestion.
    Runs asynchronously in the background.
    """
    from backend.ingestion.scheduler import ingestion_status, trigger_ingestion

    if ingestion_status.get("running"):
        raise HTTPException(
            status_code=409,
            detail="Ingestion is already running. Please wait for it to complete.",
        )

    queries = req.queries or settings.seed_queries
    trigger_ingestion(queries=queries)

    return IngestResponse(
        status="started",
        message=f"Ingestion started for {len(queries)} search queries. Check /api/status for progress.",
    )
