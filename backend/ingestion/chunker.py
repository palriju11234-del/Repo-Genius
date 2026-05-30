"""
Chunker — cleans markdown and splits repo documents into meaningful chunks.
Uses heading-aware splitting with a fixed-size fallback.
"""
import re
from typing import Any

# Target chunk size in characters (~400 tokens at 4 chars/token)
CHUNK_SIZE = 1600
CHUNK_OVERLAP = 200
MIN_CHUNK_SIZE = 80


def clean_markdown(text: str) -> str:
    """Strip noise from markdown: badges, images, HTML comments, excess whitespace."""
    # Remove HTML comments
    text = re.sub(r"<!--.*?-->", "", text, flags=re.DOTALL)
    # Remove badge/shield images (e.g., [![Build](...)](...)  or ![badge](url))
    text = re.sub(r"!\[.*?\]\(https?://[^\)]+\)", "", text)
    # Remove bare image links
    text = re.sub(r"!\[.*?\]\([^\)]*\)", "", text)
    # Remove HTML tags
    text = re.sub(r"<[^>]+>", " ", text)
    # Collapse multiple blank lines
    text = re.sub(r"\n{3,}", "\n\n", text)
    # Strip trailing whitespace per line
    lines = [ln.rstrip() for ln in text.splitlines()]
    return "\n".join(lines).strip()


def split_by_headings(text: str) -> list[str]:
    """Split markdown text on H1/H2/H3 headings."""
    parts = re.split(r"(?m)^(#{1,3} .+)$", text)
    sections: list[str] = []
    current = ""
    for part in parts:
        if re.match(r"^#{1,3} ", part):
            if current.strip():
                sections.append(current.strip())
            current = part + "\n"
        else:
            current += part
    if current.strip():
        sections.append(current.strip())
    return [s for s in sections if len(s) >= MIN_CHUNK_SIZE]


def fixed_size_split(text: str, size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Fall back: fixed-size character chunks with overlap."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + size
        chunks.append(text[start:end])
        start += size - overlap
    return [c for c in chunks if len(c) >= MIN_CHUNK_SIZE]


def chunk_document(repo: dict[str, Any]) -> list[dict[str, Any]]:
    """
    Clean and chunk a repo document.

    Returns a list of chunk dicts:
        { "text": str, "metadata": { repo fields … , "chunk_index": int } }
    """
    # Build the body text: description + README + dependencies
    parts = []
    if repo.get("description"):
        parts.append(f"Description: {repo['description']}")
    if repo.get("readme"):
        parts.append(clean_markdown(repo["readme"]))
    if repo.get("dependencies"):
        parts.append(f"Dependencies:\n{repo['dependencies']}")

    full_text = "\n\n".join(parts)

    # Try heading-aware split first
    sections = split_by_headings(full_text)
    if not sections:
        sections = fixed_size_split(full_text)

    # If still nothing, use a single chunk of description
    if not sections:
        sections = [repo.get("description", repo["full_name"])]

    # Build metadata common to all chunks
    base_meta: dict[str, Any] = {
        "full_name": repo.get("full_name", ""),
        "name": repo.get("name", ""),
        "description": repo.get("description", ""),
        "url": repo.get("url", ""),
        "stars": repo.get("stars", 0),
        "language": repo.get("language", "Unknown"),
        "topics": ",".join(repo.get("topics", [])),
        "license": repo.get("license", ""),
    }

    chunks = []
    for i, section in enumerate(sections):
        meta = dict(base_meta)
        meta["chunk_index"] = i
        chunks.append({"text": section, "metadata": meta})

    return chunks
