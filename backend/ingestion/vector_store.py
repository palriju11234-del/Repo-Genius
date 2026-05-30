"""
VectorStore — ChromaDB persistent store for repo chunks.
"""
import logging
from typing import Any

import chromadb
from chromadb.config import Settings as ChromaSettings

from backend.config import settings as app_settings

logger = logging.getLogger(__name__)

COLLECTION_NAME = "repos"


class VectorStore:
    """Thin wrapper around a ChromaDB collection."""

    def __init__(self, path: str | None = None):
        db_path = path or app_settings.chroma_db_path
        self._client = chromadb.PersistentClient(
            path=db_path,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
        self._collection = self._client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )
        logger.info(f"VectorStore initialized at '{db_path}' — {self.count()} docs")

    # ------------------------------------------------------------------ #
    #  Write                                                               #
    # ------------------------------------------------------------------ #

    def upsert(
        self,
        chunks: list[dict[str, Any]],
        embeddings: list[list[float]],
    ) -> int:
        """
        Upsert chunks with their embeddings.
        Returns number of documents upserted.
        """
        if not chunks:
            return 0

        ids, docs, metas, embs = [], [], [], []
        for chunk, emb in zip(chunks, embeddings):
            meta = chunk["metadata"]
            doc_id = f"{meta['full_name']}__chunk_{meta['chunk_index']}"
            # ChromaDB metadata values must be str | int | float | bool
            safe_meta = _sanitize_metadata(meta)
            ids.append(doc_id)
            docs.append(chunk["text"])
            metas.append(safe_meta)
            embs.append(emb)

        self._collection.upsert(
            ids=ids,
            documents=docs,
            metadatas=metas,
            embeddings=embs,
        )
        logger.info(f"Upserted {len(ids)} chunks")
        return len(ids)

    # ------------------------------------------------------------------ #
    #  Read                                                                #
    # ------------------------------------------------------------------ #

    def query(
        self,
        embedding: list[float],
        n_results: int = 20,
        where: dict | None = None,
    ) -> list[dict[str, Any]]:
        """
        Semantic similarity search.
        Returns list of { text, metadata, distance } dicts.
        """
        kwargs: dict[str, Any] = {
            "query_embeddings": [embedding],
            "n_results": min(n_results, max(self.count(), 1)),
            "include": ["documents", "metadatas", "distances"],
        }
        if where:
            kwargs["where"] = where

        results = self._collection.query(**kwargs)

        output = []
        for doc, meta, dist in zip(
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0],
        ):
            output.append({"text": doc, "metadata": meta, "distance": dist})
        return output

    def list_indexed_repos(self) -> set[str]:
        """Return set of full_names already in the store."""
        if self.count() == 0:
            return set()
        result = self._collection.get(include=["metadatas"])
        return {m.get("full_name", "") for m in result["metadatas"]}

    def count(self) -> int:
        return self._collection.count()


# ------------------------------------------------------------------ #
#  Helpers                                                             #
# ------------------------------------------------------------------ #

def _sanitize_metadata(meta: dict) -> dict:
    """Ensure all metadata values are ChromaDB-compatible primitives."""
    safe = {}
    for k, v in meta.items():
        if isinstance(v, (str, int, float, bool)):
            safe[k] = v
        elif isinstance(v, list):
            safe[k] = ",".join(str(x) for x in v)
        else:
            safe[k] = str(v)
    return safe


# Module-level singleton
_store: VectorStore | None = None


def get_vector_store() -> VectorStore:
    global _store
    if _store is None:
        _store = VectorStore()
    return _store
