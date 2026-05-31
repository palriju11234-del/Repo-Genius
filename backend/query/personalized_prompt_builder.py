"""
PersonalizedPromptBuilder — extends the base prompt with user profile context
so the LLM generates profile-aware, goal-sensitive per-repo insights.
"""
from typing import Any

PERSONALIZED_SYSTEM_PROMPT = """You are an AI GitHub project recommender with deep knowledge of developer experience levels and goals.

Analyze the retrieved repositories and return a JSON response with per-repository insights TAILORED to the user's profile.

User Profile Context will be provided. Use it to:
- Frame insights in terms the user will understand (e.g., simple explanations for beginners)
- Highlight features relevant to their goal (learning, production, hackathon, etc.)
- Point out complexity level explicitly

Your response MUST be valid JSON in this exact format:
{
  "repos": [
    {
      "full_name": "owner/repo-name",
      "brief_description": "one clear paragraph describing what this project does — calibrated to the user's experience level (plain English for beginners, technical for advanced).",
      "insight": "2-3 sentence explanation tailored to the user's experience level and goal.",
      "why_it_fits": "One sentence specifically addressing why this fits the user's profile.",
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
- brief_description must be a single paragraph. Adjust vocabulary to match the user's experience level.
- Calibrate language complexity to match the user's experience level.
- For beginners: emphasize simplicity, good docs, easy setup.
- For advanced/professional: emphasize architecture, scalability, production-readiness.
- Return ONLY the raw JSON — no markdown, no code fences, no extra text.
"""


def build_personalized_prompt(
    query: str,
    results: list[dict[str, Any]],
    profile: dict,
) -> tuple[str, str]:
    """
    Build system prompt and user message incorporating the developer profile.

    Args:
        query: The original user query.
        results: List of { text, metadata, distance } from the retriever.
        profile: UserProfile dict.

    Returns:
        (system_prompt, user_message) tuple.
    """
    # Deduplicate by repo full_name
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

    # Build profile summary for the LLM
    experience = profile.get("experience", "intermediate").capitalize()
    goal = profile.get("goal", "building").replace("_", " ").capitalize()
    lang = profile.get("language", "Python")
    complexity = profile.get("complexity", "moderate").capitalize()
    project_types = ", ".join(profile.get("project_types", [])) or "General"

    profile_block = (
        f"Developer Profile:\n"
        f"  Experience Level: {experience}\n"
        f"  Primary Goal: {goal}\n"
        f"  Preferred Language: {lang}\n"
        f"  Complexity Preference: {complexity}\n"
        f"  Interested In: {project_types}\n"
    )

    user_message = (
        f"User Query: {query}\n\n"
        f"{profile_block}\n"
        f"Retrieved Repository Context:\n\n"
        f"{context}\n\n"
        f"Return the JSON insights object tailored to the developer's profile. "
        f"Use the exact full_name values from the context above."
    )

    return PERSONALIZED_SYSTEM_PROMPT, user_message
