"""
Sufficiency checker — decides whether retrieved results are good enough
to proceed directly to the LLM, or whether auto-ingestion is needed.
"""
from backend.config import settings


def check_sufficiency(
    results: list[dict],
    min_results: int | None = None,
    max_distance: float | None = None,
) -> tuple[bool, str]:
    """
    Evaluate whether the retrieved results are sufficient.

    A result set is sufficient when:
      1. The number of results meets the minimum threshold, AND
      2. The best (lowest) cosine distance is within the threshold.

    Cosine distance is in [0, 2]; normalized embeddings give [0, 1].
    Lower distance = more similar.

    Returns:
        (is_sufficient: bool, reason: str)
    """
    _min = min_results if min_results is not None else settings.min_results
    _max_dist = max_distance if max_distance is not None else settings.max_distance

    if not results:
        return False, "No results returned from vector store"

    if len(results) < _min:
        return False, (
            f"Only {len(results)} results found (minimum required: {_min})"
        )

    best_distance = min(r["distance"] for r in results)
    if best_distance > _max_dist:
        return False, (
            f"Best similarity distance {best_distance:.3f} exceeds threshold {_max_dist}"
        )

    return True, f"{len(results)} results, best distance {best_distance:.3f}"
