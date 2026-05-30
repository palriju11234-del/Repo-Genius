"""
Content extractor — fetches README and dependency files from GitHub.
"""
import base64
import logging
import time

import httpx

from backend.config import settings

logger = logging.getLogger(__name__)

DEPENDENCY_FILES = [
    "requirements.txt",
    "package.json",
    "go.mod",
    "Cargo.toml",
    "pom.xml",
    "build.gradle",
    "Gemfile",
    "pyproject.toml",
    "setup.py",
]


def _headers() -> dict:
    h = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if settings.github_token:
        h["Authorization"] = f"Bearer {settings.github_token}"
    return h


def extract_content(repo: dict) -> dict:
    """
    Fetch README and dependency file contents for a repository.
    Returns the repo dict enriched with 'readme' and 'dependencies' fields.
    """
    full_name = repo["full_name"]
    branch = repo.get("default_branch", "main")

    with httpx.Client(headers=_headers(), timeout=20) as client:
        readme = _fetch_readme(client, full_name, branch)
        deps = _fetch_dependencies(client, full_name, branch)

    enriched = dict(repo)
    enriched["readme"] = readme
    enriched["dependencies"] = deps
    return enriched


def _fetch_readme(client: httpx.Client, full_name: str, branch: str) -> str:
    """Try to fetch README from common filenames."""
    candidates = ["README.md", "readme.md", "README.rst", "README.txt", "README"]
    for name in candidates:
        url = f"https://api.github.com/repos/{full_name}/contents/{name}"
        try:
            resp = client.get(url, params={"ref": branch})
            if resp.status_code == 200:
                data = resp.json()
                if isinstance(data, dict) and data.get("encoding") == "base64":
                    content = base64.b64decode(data["content"]).decode("utf-8", errors="replace")
                    return content[:15000]  # cap at 15k chars
        except Exception as e:
            logger.debug(f"README fetch failed for {full_name}/{name}: {e}")
        time.sleep(0.1)
    return ""


def _fetch_dependencies(client: httpx.Client, full_name: str, branch: str) -> str:
    """Fetch first found dependency file and return its content."""
    for dep_file in DEPENDENCY_FILES:
        url = f"https://api.github.com/repos/{full_name}/contents/{dep_file}"
        try:
            resp = client.get(url, params={"ref": branch})
            if resp.status_code == 200:
                data = resp.json()
                if isinstance(data, dict) and data.get("encoding") == "base64":
                    content = base64.b64decode(data["content"]).decode("utf-8", errors="replace")
                    return f"[{dep_file}]\n{content[:3000]}"
        except Exception:
            pass
        time.sleep(0.05)
    return ""
