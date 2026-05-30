"""
Retriever — embeds a user query and performs Top-K semantic search in ChromaDB.
"""
import logging
from typing import Any

from backend.ingestion.embedder import get_embedder
from backend.ingestion.vector_store import get_vector_store
from backend.config import settings

logger = logging.getLogger(__name__)


def retrieve(
    query: str,
    n_results: int = 20,
    language: str | None = None,
    topics: list[str] | None = None,
) -> list[dict[str, Any]]:
    """
    Convert the query to an embedding and perform cosine similarity search.

    Args:
        query: Natural language query string.
        n_results: Number of chunks to retrieve.
        language: Optional programming language filter.
        topics: Optional list of topics (any match). Not used as a hard filter
                since ChromaDB $contains on comma-joined strings is unreliable;
                we apply it as a post-filter instead.

    Returns:
        List of { text, metadata, distance } dicts, sorted by distance (ascending).
    """
    embedder = get_embedder()
    store = get_vector_store()

    query_embedding = embedder.encode_one(query)

    where: dict | None = None
    if language:
        where = {"language": {"$eq": language}}

    raw_results = store.query(
        embedding=query_embedding,
        n_results=n_results,
        where=where,
    )

    # Post-filter by topic if requested
    if topics:
        topics_lower = {t.lower() for t in topics}
        filtered = []
        for r in raw_results:
            repo_topics = r["metadata"].get("topics", "").lower()
            if any(t in repo_topics for t in topics_lower):
                filtered.append(r)
        # If topic filter removed everything, fall back to unfiltered
        raw_results = filtered if filtered else raw_results

    logger.info(
        f"Retrieval: query='{query[:60]}…' → {len(raw_results)} results"
        f" (best distance={raw_results[0]['distance']:.3f})" if raw_results else ""
    )
    return raw_results
