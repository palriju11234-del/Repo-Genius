"""
Ingestion package — exposes the run_ingestion entry-point.
"""
from .github_fetcher import fetch_repositories
from .quality_filter import filter_repositories
from .content_extractor import extract_content
from .chunker import chunk_document
from .embedder import Embedder
from .vector_store import VectorStore

__all__ = [
    "fetch_repositories",
    "filter_repositories",
    "extract_content",
    "chunk_document",
    "Embedder",
    "VectorStore",
]
