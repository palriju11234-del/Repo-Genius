"""
Prompt builder — formats retrieved chunks into a structured LLM prompt.
Generates per-repository JSON insights for the frontend to display individually.
"""
from typing import Any


SYSTEM_PROMPT = """You are an AI GitHub project recommender.

Analyze the retrieved repositories and return a JSON response with per-repository insights.

Your response MUST be valid JSON in this exact format:
{
  "repos": [
    {
      "full_name": "owner/repo-name",
      "brief_description": "One clear paragraph describing what this project does in plain English — written for a developer browsing search results.",
      "insight": "2-3 sentence explanation of what this project does and why it matches the user's query.",
      "why_it_fits": "One sentence on why it fits the query specifically.",
      "suitability": "Beginner" | "Intermediate" | "Advanced",
      "advantages": ["advantage 1", "advantage 2", "advantage 3"],
      "disadvantages": ["disadvantage 1", "disadvantage 2"],
      "best_use_case": "One sentence describing the ideal use case for this repo."
    }
  ],
  "summary": {
    "best_for_beginners": "owner/repo-name",
    "best_for_scalability": "owner/repo-name",
    "best_for_learning": "owner/repo-name"
  }
}

Rules:
- Only include repos from the provided context. Do not invent repos.
- brief_description must be a short paragraph, jargon-free, and understandable by any developer.
- Keep each insight concise and developer-friendly.
- Return ONLY the raw JSON — no markdown, no code fences, no extra text.
"""


def build_prompt(query: str, results: list[dict[str, Any]]) -> tuple[str, str]:
    """
    Build system prompt and user message for the LLM.

    Args:
        query: The original user query.
        results: List of { text, metadata, distance } from the retriever.

    Returns:
        (system_prompt, user_message) tuple.
    """
    # Deduplicate by repo full_name, keep best (lowest distance) chunk per repo
    seen: dict[str, dict] = {}
    for r in results:
        fn = r["metadata"].get("full_name", "")
        if fn not in seen or r["distance"] < seen[fn]["distance"]:
            seen[fn] = r

    top_repos = sorted(seen.values(), key=lambda x: x["distance"])[:8]

    context_blocks = []
    for i, repo in enumerate(top_repos, 1):
        meta = repo["metadata"]
        block = (
            f"[Repo {i}]\n"
            f"Name: {meta.get('full_name', 'Unknown')}\n"
            f"URL: {meta.get('url', '')}\n"
            f"Stars: {meta.get('stars', 0):,}\n"
            f"Language: {meta.get('language', 'Unknown')}\n"
            f"Topics: {meta.get('topics', '')}\n"
            f"Description: {meta.get('description', '')}\n"
            f"Relevant excerpt:\n{repo['text'][:600]}\n"
        )
        context_blocks.append(block)

    context = "\n---\n".join(context_blocks)

    user_message = (
        f"User Query: {query}\n\n"
        f"Retrieved Repository Context:\n\n"
        f"{context}\n\n"
        f"Return the JSON insights object as described. Use the exact full_name values from the context above."
    )

    return SYSTEM_PROMPT, user_message
