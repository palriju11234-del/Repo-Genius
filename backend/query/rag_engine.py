"""
RAG Engine — orchestrates the full query-processing pipeline.

Flow:
  query → embed → top-K retrieval → sufficiency check
    → [auto-ingest + retry if insufficient]
    → prompt builder → LLM → per-repo JSON insights → structured response
"""
import json
import logging
import re
from typing import Any

from backend.query.retriever import retrieve
from backend.query.sufficiency_checker import check_sufficiency
from backend.query.prompt_builder import build_prompt
from backend.query.llm_client import generate

logger = logging.getLogger(__name__)


def _deduplicate_repos(results: list[dict]) -> list[dict]:
    """Keep the best (lowest distance) chunk per repo."""
    seen: dict[str, dict] = {}
    for r in results:
        fn = r["metadata"].get("full_name", "")
        if fn not in seen or r["distance"] < seen[fn]["distance"]:
            seen[fn] = r
    return sorted(seen.values(), key=lambda x: x["distance"])


def _parse_llm_json(llm_text: str) -> dict:
    """
    Safely extract and parse JSON from the LLM response.
    Handles cases where the model wraps JSON in markdown fences.
    """
    # Strip markdown code fences if present
    clean = re.sub(r"```(?:json)?", "", llm_text).strip().rstrip("`").strip()
    try:
        return json.loads(clean)
    except json.JSONDecodeError:
        # Try to find the outermost { ... } block
        match = re.search(r"\{.*\}", clean, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                pass
    logger.warning("Could not parse LLM JSON response — returning empty insights")
    return {}


def _parse_recommendations(llm_json: dict, results: list[dict]) -> list[dict[str, Any]]:
    """
    Build structured recommendations merging vector DB metadata with per-repo
    LLM insights extracted from the parsed JSON response.
    """
    unique_repos = _deduplicate_repos(results)[:8]

    # Build a lookup from full_name → repo insight dict
    repo_insights: dict[str, dict] = {}
    for item in llm_json.get("repos", []):
        fn = item.get("full_name", "")
        if fn:
            repo_insights[fn] = item

    recs = []
    for r in unique_repos:
        meta = r["metadata"]
        full_name = meta.get("full_name", "")
        insight = repo_insights.get(full_name, {})

        recs.append({
            "full_name": full_name,
            "name": meta.get("name", ""),
            "description": meta.get("description", ""),
            "url": meta.get("url", ""),
            "stars": meta.get("stars", 0),
            "language": meta.get("language", "Unknown"),
            "topics": [t for t in meta.get("topics", "").split(",") if t],
            "relevance_score": round(1 - r["distance"], 3),
            # Per-repo AI insights
            "ai_brief_description": insight.get("brief_description", ""),
            "ai_insight": insight.get("insight", ""),
            "ai_why_it_fits": insight.get("why_it_fits", ""),
            "ai_suitability": insight.get("suitability", ""),
            "ai_advantages": insight.get("advantages", []),
            "ai_disadvantages": insight.get("disadvantages", []),
            "ai_best_use_case": insight.get("best_use_case", ""),
        })
    return recs


class RagEngine:
    """Stateless RAG orchestrator — instantiate once and reuse."""

    def query(
        self,
        query: str,
        language: str | None = None,
        topics: list[str] | None = None,
        n_results: int = 20,
    ) -> dict[str, Any]:
        """
        Run the full RAG pipeline for a user query.

        Returns:
            {
                "query": str,
                "recommendations": List[repo dicts with per-repo ai insights],
                "summary": dict (best_for_beginners, best_for_scalability, best_for_learning),
                "source": "vector_db" | "auto_ingestion",
                "result_count": int,
            }
        """
        logger.info(f"RAG query: '{query}'")

        # Step 1 — Retrieve from vector DB
        results = retrieve(query, n_results=n_results, language=language, topics=topics)

        # Step 2 — Sufficiency check
        sufficient, reason = check_sufficiency(results)
        source = "vector_db"

        if not sufficient:
            logger.info(f"Insufficient results ({reason}) — triggering auto-ingestion")
            from backend.query.auto_ingestion import auto_ingest_and_retry
            results = auto_ingest_and_retry(query, language=language, topics=topics)
            source = "auto_ingestion"

            # Re-check after ingestion
            sufficient, reason = check_sufficiency(results)
            if not sufficient:
                logger.warning(f"Still insufficient after auto-ingestion: {reason}")

        # Step 3 — Build prompt and call LLM
        llm_json: dict = {}
        if results:
            system_prompt, user_message = build_prompt(query, results)
            llm_text = generate(system_prompt, user_message)
            llm_json = _parse_llm_json(llm_text)
        
        # Step 4 — Structure the response with per-repo insights
        recommendations = _parse_recommendations(llm_json, results) if results else []
        summary = llm_json.get("summary", {})

        return {
            "query": query,
            "recommendations": recommendations,
            "summary": summary,
            "source": source,
            "result_count": len(results),
        }


# Module-level singleton
_engine: RagEngine | None = None


def get_rag_engine() -> RagEngine:
    global _engine
    if _engine is None:
        _engine = RagEngine()
    return _engine
