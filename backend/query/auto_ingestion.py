"""
Auto-ingestion — triggers targeted GitHub ingestion when retrieval is insufficient,
then retries the semantic search.
"""
import logging
import re
import threading

from backend.config import settings
from backend.ingestion.scheduler import _run_ingestion, ingestion_status

logger = logging.getLogger(__name__)

MAX_ATTEMPTS = 2


def _query_to_search_terms(query: str) -> list[str]:
    """
    Convert a natural-language query into GitHub search query strings.
    Simple heuristic: extract meaningful words, strip common stop words.
    """
    stop_words = {
        "a", "an", "the", "for", "with", "that", "this", "can", "i", "me",
        "my", "to", "of", "in", "on", "is", "are", "was", "what", "how",
        "find", "show", "give", "best", "good", "need", "want", "using",
        "library", "tool", "framework", "project", "repository", "repo",
    }
    words = re.findall(r"\b[a-zA-Z][a-zA-Z0-9+#-]{2,}\b", query.lower())
    keywords = [w for w in words if w not in stop_words]

    if not keywords:
        return [query]

    # Generate 1–3 search queries from keyword combinations
    queries = []
    if len(keywords) >= 2:
        queries.append(" ".join(keywords[:3]))
        queries.append(keywords[0])
    else:
        queries.append(keywords[0])

    return queries[:3]


def auto_ingest_and_retry(
    query: str,
    language: str | None = None,
    topics: list[str] | None = None,
    attempts: int = 0,
) -> list[dict]:
    """
    Run targeted ingestion based on the query, then retry retrieval.

    Args:
        query: The original user query.
        language: Optional language filter for retrieval retry.
        topics: Optional topic filter for retrieval retry.
        attempts: Current attempt count (to cap recursion).

    Returns:
        Updated retrieval results (may still be empty if ingestion found nothing relevant).
    """
    from backend.query.retriever import retrieve

    if attempts >= MAX_ATTEMPTS:
        logger.warning("Auto-ingestion: max attempts reached, returning empty results")
        return []

    search_terms = _query_to_search_terms(query)
    logger.info(f"Auto-ingestion triggered — search terms: {search_terms}")

    # Run ingestion synchronously (blocking) so we can retry immediately after
    _run_ingestion(queries=search_terms)

    # Retry retrieval
    results = retrieve(query, n_results=20, language=language, topics=topics)
    logger.info(f"Auto-ingestion retry: {len(results)} results")
    return results
