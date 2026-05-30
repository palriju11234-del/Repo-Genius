"""
Embedder — wraps sentence-transformers for batched text embedding.
"""
import logging
from functools import lru_cache

import numpy as np

from backend.config import settings

logger = logging.getLogger(__name__)


class Embedder:
    """Singleton-friendly wrapper around a sentence-transformer model."""

    def __init__(self, model_name: str | None = None):
        self._model_name = model_name or settings.embedding_model
        self._model = None

    def _load(self):
        if self._model is None:
            logger.info(f"Loading embedding model: {self._model_name}")
            from sentence_transformers import SentenceTransformer
            self._model = SentenceTransformer(self._model_name)
            logger.info("Embedding model loaded.")

    def encode(self, texts: list[str], batch_size: int = 64) -> list[list[float]]:
        """
        Encode a list of texts into dense vectors.
        Returns a list of float lists (JSON-serialisable).
        """
        self._load()
        if not texts:
            return []
        vecs: np.ndarray = self._model.encode(
            texts,
            batch_size=batch_size,
            show_progress_bar=False,
            normalize_embeddings=True,
        )
        return vecs.tolist()

    def encode_one(self, text: str) -> list[float]:
        """Encode a single text string."""
        return self.encode([text])[0]

    @property
    def dimension(self) -> int:
        self._load()
        return self._model.get_sentence_embedding_dimension()


# Module-level singleton
_embedder: Embedder | None = None


def get_embedder() -> Embedder:
    global _embedder
    if _embedder is None:
        _embedder = Embedder()
    return _embedder
