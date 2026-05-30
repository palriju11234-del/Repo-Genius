"""
GitHub REST API fetcher.
Searches for repositories based on query strings and returns raw repo dicts.
"""
import logging
import time
from datetime import datetime, timezone
from typing import Generator

import httpx

from backend.config import settings

logger = logging.getLogger(__name__)

GITHUB_API = "https://api.github.com"
SEARCH_URL = f"{GITHUB_API}/search/repositories"


def _headers() -> dict:
    h = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if settings.github_token:
        h["Authorization"] = f"Bearer {settings.github_token}"
    return h


def fetch_repositories(
    queries: list[str],
    max_per_query: int = 100,
) -> Generator[dict, None, None]:
    """
    Yield raw repository dicts for each search query.
    Handles pagination and rate-limiting automatically.
    """
    seen: set[str] = set()

    with httpx.Client(headers=_headers(), timeout=30) as client:
        for query in queries:
            logger.info(f"Fetching GitHub repos for query: '{query}'")
            fetched = 0
            page = 1

            while fetched < max_per_query:
                per_page = min(30, max_per_query - fetched)
                params = {
                    "q": query,
                    "sort": "stars",
                    "order": "desc",
                    "per_page": per_page,
                    "page": page,
                }

                try:
                    resp = client.get(SEARCH_URL, params=params)
                except httpx.RequestError as e:
                    logger.error(f"Network error fetching '{query}': {e}")
                    break

                if resp.status_code == 403:
                    reset = int(resp.headers.get("X-RateLimit-Reset", time.time() + 60))
                    wait = max(reset - int(time.time()), 1)
                    logger.warning(f"Rate limited. Sleeping {wait}s …")
                    time.sleep(wait)
                    continue

                if resp.status_code != 200:
                    logger.error(f"GitHub API error {resp.status_code}: {resp.text[:200]}")
                    break

                data = resp.json()
                items = data.get("items", [])
                if not items:
                    break

                for repo in items:
                    full_name = repo.get("full_name", "")
                    if full_name in seen:
                        continue
                    seen.add(full_name)
                    yield _normalize(repo)
                    fetched += 1

                if len(items) < per_page:
                    break  # no more pages

                page += 1
                time.sleep(0.5)  # be a good citizen


def _normalize(repo: dict) -> dict:
    """Extract and normalize relevant fields from a raw GitHub repo object."""
    pushed_at = repo.get("pushed_at") or ""
    try:
        pushed_dt = datetime.fromisoformat(pushed_at.replace("Z", "+00:00"))
        days_since_push = (datetime.now(timezone.utc) - pushed_dt).days
    except (ValueError, AttributeError):
        days_since_push = 9999

    return {
        "full_name": repo.get("full_name", ""),
        "name": repo.get("name", ""),
        "description": repo.get("description") or "",
        "url": repo.get("html_url", ""),
        "api_url": repo.get("url", ""),
        "stars": repo.get("stargazers_count", 0),
        "forks": repo.get("forks_count", 0),
        "language": repo.get("language") or "Unknown",
        "topics": repo.get("topics", []),
        "is_fork": repo.get("fork", False),
        "default_branch": repo.get("default_branch", "main"),
        "days_since_push": days_since_push,
        "pushed_at": pushed_at,
        "license": (repo.get("license") or {}).get("spdx_id", ""),
    }
