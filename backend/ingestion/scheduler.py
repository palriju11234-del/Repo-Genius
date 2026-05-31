"""
Scheduler — APScheduler-based periodic and on-demand ingestion trigger.
"""
import logging
from datetime import datetime, timezone
from typing import Any

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

from backend.config import settings

logger = logging.getLogger(__name__)

# Shared status dict — read by the /api/status endpoint
ingestion_status: dict[str, Any] = {
    "running": False,
    "last_run": None,
    "last_run_result": None,
    "repos_added": 0,
    "chunks_added": 0,
    "total_repos_indexed": 0,
    "error": None,
}


def _run_ingestion(queries: list[str] | None = None):
    """Full ingestion pipeline: fetch → filter → extract → chunk → embed → store."""
    from backend.ingestion.github_fetcher import fetch_repositories
    from backend.ingestion.quality_filter import filter_repositories
    from backend.ingestion.content_extractor import extract_content
    from backend.ingestion.chunker import chunk_document
    from backend.ingestion.embedder import get_embedder
    from backend.ingestion.vector_store import get_vector_store

    ingestion_status["running"] = True
    ingestion_status["error"] = None
    ingestion_status["repos_added"] = 0
    ingestion_status["chunks_added"] = 0

    try:
        store = get_vector_store()
        embedder = get_embedder()
        already_indexed = store.list_indexed_repos()
        active_queries = queries or settings.seed_queries

        logger.info(f"Ingestion started — {len(active_queries)} queries, {len(already_indexed)} repos already indexed")

        for raw_repo in fetch_repositories(active_queries, max_per_query=50):
            filtered = filter_repositories([raw_repo], already_indexed=already_indexed)
            if not filtered:
                continue

            repo = filtered[0]
            try:
                enriched = extract_content(repo)
            except Exception as e:
                logger.warning(f"Content extraction failed for {repo['full_name']}: {e}")
                enriched = dict(repo)
                enriched.setdefault("readme", "")
                enriched.setdefault("dependencies", "")

            chunks = chunk_document(enriched)
            if not chunks:
                continue

            texts = [c["text"] for c in chunks]
            embeddings = embedder.encode(texts)
            n = store.upsert(chunks, embeddings)

            already_indexed.add(repo["full_name"])
            ingestion_status["repos_added"] += 1
            ingestion_status["chunks_added"] += n

        ingestion_status["total_repos_indexed"] = store.count()
        ingestion_status["last_run"] = datetime.now(timezone.utc).isoformat()
        ingestion_status["last_run_result"] = "success"
        logger.info(
            f"Ingestion complete — added {ingestion_status['repos_added']} repos, "
            f"{ingestion_status['chunks_added']} chunks"
        )

    except Exception as e:
        logger.exception("Ingestion pipeline failed")
        ingestion_status["error"] = str(e)
        ingestion_status["last_run_result"] = "error"
    finally:
        ingestion_status["running"] = False


def trigger_ingestion(queries: list[str] | None = None):
    """Manually trigger ingestion (runs in the current thread — use background for API calls)."""
    import threading
    t = threading.Thread(target=_run_ingestion, args=(queries,), daemon=True)
    t.start()
    return t


_scheduler: BackgroundScheduler | None = None


def run_vector_db_cleanup():
    """Clean old repositories from the vector database."""
    from backend.ingestion.vector_store import get_vector_store

    logger.info("Starting scheduled vector database cleanup ...")
    try:
        store = get_vector_store()
        deleted_count = store.delete_old_repositories(settings.max_repo_age_hours)
        logger.info(f"Vector database cleanup complete. Deleted {deleted_count} chunks.")
    except Exception as e:
        logger.exception(f"Vector database cleanup failed: {e}")


def start_scheduler():
    """Start the APScheduler background scheduler if intervals > 0."""
    global _scheduler
    
    has_jobs = False
    _scheduler = BackgroundScheduler()

    if settings.ingestion_interval_hours > 0:
        _scheduler.add_job(
            _run_ingestion,
            trigger=IntervalTrigger(hours=settings.ingestion_interval_hours),
            id="ingestion_job",
            replace_existing=True,
        )
        has_jobs = True
        logger.info(f"Ingestion scheduler started — runs every {settings.ingestion_interval_hours}h")
    else:
        logger.info("Scheduled ingestion disabled (INGESTION_INTERVAL_HOURS=0)")

    if settings.cleanup_interval_hours > 0:
        _scheduler.add_job(
            run_vector_db_cleanup,
            trigger=IntervalTrigger(hours=settings.cleanup_interval_hours),
            id="cleanup_job",
            replace_existing=True,
        )
        has_jobs = True
        logger.info(f"Cleanup scheduler started — runs every {settings.cleanup_interval_hours}h")
    else:
        logger.info("Scheduled cleanup disabled (CLEANUP_INTERVAL_HOURS=0)")

    if has_jobs:
        _scheduler.start()


def stop_scheduler():
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped")
