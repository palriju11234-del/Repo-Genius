"""
Quality filter — removes low-quality, inactive, or duplicate repositories.
"""
import logging
from typing import Iterable

from backend.config import settings

logger = logging.getLogger(__name__)


def filter_repositories(
    repos: Iterable[dict],
    already_indexed: set[str] | None = None,
    min_stars: int | None = None,
    max_inactivity_days: int | None = None,
) -> list[dict]:
    """
    Filter repositories by quality criteria.

    Args:
        repos: Iterable of normalized repo dicts from github_fetcher.
        already_indexed: Set of full_names already in the vector store.
        min_stars: Override for minimum star count.
        max_inactivity_days: Override for maximum days since last push.

    Returns:
        Filtered list of repo dicts.
    """
    min_stars = min_stars if min_stars is not None else settings.min_stars
    max_inactivity = max_inactivity_days if max_inactivity_days is not None else settings.max_inactivity_days
    already_indexed = already_indexed or set()

    passed, rejected = [], 0

    for repo in repos:
        full_name = repo.get("full_name", "")
        reason = _reject_reason(repo, full_name, already_indexed, min_stars, max_inactivity)
        if reason:
            logger.debug(f"Rejected '{full_name}': {reason}")
            rejected += 1
        else:
            passed.append(repo)

    logger.info(f"Quality filter: {len(passed)} passed, {rejected} rejected")
    return passed


def _reject_reason(
    repo: dict,
    full_name: str,
    already_indexed: set[str],
    min_stars: int,
    max_inactivity: int,
) -> str | None:
    if repo.get("is_fork"):
        return "is a fork"
    if repo.get("stars", 0) < min_stars:
        return f"stars={repo.get('stars')} < {min_stars}"
    if repo.get("days_since_push", 9999) > max_inactivity:
        return f"inactive for {repo.get('days_since_push')} days"
    if full_name in already_indexed:
        return "already indexed"
    if not full_name:
        return "missing full_name"
    return None
