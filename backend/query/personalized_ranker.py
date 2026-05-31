"""
PersonalizedRankingEngine — re-ranks RAG results using a weighted multi-factor score.

Scoring weights:
    Semantic Similarity      50%
    User Experience Match    20%
    Project Complexity Fit   15%
    Repository Quality       10%
    Documentation Quality     5%
"""
import logging
import math
from typing import Any

logger = logging.getLogger(__name__)

# ── Suitability mapping ────────────────────────────────────────────────────────
SUITABILITY_MAP = {
    "beginner":     {"beginner": 1.0, "intermediate": 0.5, "advanced": 0.1, "": 0.6},
    "intermediate": {"beginner": 0.6, "intermediate": 1.0, "advanced": 0.6, "": 0.7},
    "advanced":     {"beginner": 0.3, "intermediate": 0.7, "advanced": 1.0, "": 0.7},
    "professional": {"beginner": 0.1, "intermediate": 0.5, "advanced": 1.0, "": 0.6},
}

# ── Complexity-stars heuristics ────────────────────────────────────────────────
# simple < 500 stars generally; advanced > 2000
COMPLEXITY_STAR_BANDS = {
    "simple":   (0,    1000),
    "moderate": (300,  5000),
    "advanced": (1000, 9_999_999),
}

# Goal → preferred suitability levels
GOAL_SUITABILITY = {
    "learning":    ["beginner", "intermediate"],
    "building":    ["intermediate", "advanced"],
    "hackathons":  ["beginner", "intermediate"],
    "open_source": ["intermediate", "advanced"],
    "production":  ["advanced"],
    "research":    ["advanced", "intermediate"],
}


# ── Sub-scorers ────────────────────────────────────────────────────────────────

def _experience_match(rec: dict, experience: str) -> float:
    """Score 0–1 based on how well ai_suitability matches user experience."""
    ai_suit = (rec.get("ai_suitability") or "").lower()
    mapping = SUITABILITY_MAP.get(experience, SUITABILITY_MAP["intermediate"])
    return mapping.get(ai_suit, 0.6)


def _complexity_fit(rec: dict, complexity: str) -> float:
    """Score 0–1 based on star count and topic density as complexity proxies."""
    stars = rec.get("stars", 0)
    topics = rec.get("topics", [])
    topic_count = len(topics) if isinstance(topics, list) else len(str(topics).split(","))

    lo, hi = COMPLEXITY_STAR_BANDS.get(complexity, (300, 5000))

    # Star band score — sigmoid centered on band midpoint
    mid = (lo + hi) / 2 if hi < 9_000_000 else lo * 3
    spread = max(mid * 0.5, 500)
    star_score = 1 / (1 + math.exp(-((stars - mid) / spread)))

    # For "simple", invert so fewer stars score higher
    if complexity == "simple":
        star_score = 1 - star_score

    # Topic density proxy
    topic_score = min(topic_count / 8, 1.0)
    if complexity == "simple":
        topic_score = 1 - topic_score * 0.5   # less penalising for simple

    return round((star_score * 0.7 + topic_score * 0.3), 3)


def _repo_quality(rec: dict) -> float:
    """Score 0–1 based on stars and activity."""
    stars = rec.get("stars", 0)
    # Log-normalise against a reference of 10k stars = 1.0
    return round(min(math.log1p(stars) / math.log1p(10_000), 1.0), 3)


def _doc_quality(rec: dict) -> float:
    """Heuristic 0–1 for documentation richness."""
    topics = rec.get("topics", [])
    topic_count = len(topics) if isinstance(topics, list) else len(str(topics).split(","))
    desc_len = len(rec.get("description", ""))

    topic_score = min(topic_count / 6, 1.0)
    desc_score = min(desc_len / 200, 1.0)
    return round((topic_score * 0.5 + desc_score * 0.5), 3)


def _language_match(rec: dict, profile_langs: list[str]) -> bool:
    """True if repo language is in user's preferred languages."""
    if not profile_langs:
        return False
    repo_lang = (rec.get("language") or "").lower()
    return any(repo_lang == pl.lower() for pl in profile_langs)


def _project_type_match(rec: dict, project_types: list[str]) -> list[str]:
    """Return matching project types based on topic heuristics."""
    topics_lower = " ".join(rec.get("topics", [])).lower()
    desc_lower = (rec.get("description") or "").lower()
    combined = topics_lower + " " + desc_lower

    TYPE_KEYWORDS = {
        "Web Development":  ["web", "frontend", "backend", "http", "api", "react", "django", "flask", "express"],
        "AI / ML":          ["machine-learning", "deep-learning", "nlp", "ai", "llm", "neural", "ml", "computer-vision"],
        "IoT":              ["iot", "embedded", "arduino", "raspberry", "sensor", "hardware"],
        "Cybersecurity":    ["security", "auth", "crypto", "encryption", "vulnerability", "firewall"],
        "Mobile Apps":      ["android", "ios", "flutter", "react-native", "mobile"],
        "DevOps":           ["docker", "kubernetes", "ci-cd", "devops", "cloud", "terraform", "helm"],
        "Blockchain":       ["blockchain", "ethereum", "solidity", "web3", "nft", "defi"],
        "Data Science":     ["data", "pandas", "visualization", "statistics", "jupyter", "analytics"],
    }

    matches = []
    for pt, keywords in TYPE_KEYWORDS.items():
        if pt in project_types and any(kw in combined for kw in keywords):
            matches.append(pt)
    return matches


# ── Explanation card builder ────────────────────────────────────────────────────

def build_explanation_card(rec: dict, profile: dict, score_breakdown: dict) -> list[str]:
    """Generate human-readable ✓/✗ reasons for the recommendation."""
    reasons = []
    experience = profile.get("experience", "intermediate")
    goal = profile.get("goal", "building")
    pref_langs = profile.get("languages", []) or [profile.get("language", "")]
    complexity = profile.get("complexity", "moderate")
    project_types = profile.get("project_types", [])

    # Language match
    if _language_match(rec, pref_langs):
        lang = (rec.get("language") or "").capitalize()
        reasons.append(f"✓ Matches your {lang} preference")
    else:
        repo_lang = (rec.get("language") or "Unknown").capitalize()
        if repo_lang != "Unknown":
            reasons.append(f"◎ Written in {repo_lang} (not your primary language)")

    # Experience / suitability match
    ai_suit = (rec.get("ai_suitability") or "").lower()
    exp_score = score_breakdown.get("experience_match", 0)
    if exp_score >= 0.8:
        reasons.append(f"✓ Suitable for {experience.capitalize()} developers")
    elif exp_score >= 0.5:
        reasons.append(f"◎ Moderately suitable for your experience level")
    else:
        reasons.append(f"✗ More suited for {ai_suit or 'other'} developers")

    # Project quality
    stars = rec.get("stars", 0)
    if stars >= 1000:
        reasons.append(f"✓ Actively maintained ({stars:,} stars)")
    elif stars >= 100:
        reasons.append(f"◎ Growing community ({stars:,} stars)")
    else:
        reasons.append(f"✗ Smaller community ({stars:,} stars)")

    # Documentation quality
    doc_score = score_breakdown.get("doc_quality", 0)
    if doc_score >= 0.7:
        reasons.append("✓ Rich documentation & well-tagged")
    elif doc_score >= 0.4:
        reasons.append("◎ Moderate documentation")
    else:
        reasons.append("✗ Limited documentation")

    # Goal alignment
    preferred_suits = GOAL_SUITABILITY.get(goal, [])
    if ai_suit in preferred_suits:
        goal_label = goal.replace("_", " ").capitalize()
        reasons.append(f"✓ Fits your {goal_label} goal")

    # Project type match
    matched_types = _project_type_match(rec, project_types)
    if matched_types:
        reasons.append(f"✓ Matches your {matched_types[0]} interest")
    elif project_types:
        reasons.append(f"✗ Not a primary focus of your preferred project types")

    # Complexity
    cplx_score = score_breakdown.get("complexity_fit", 0)
    if cplx_score >= 0.7:
        reasons.append(f"✓ Complexity matches your preference ({complexity})")

    return reasons


# ── Main Ranking Engine ────────────────────────────────────────────────────────

WEIGHTS = {
    "semantic":    0.50,
    "experience":  0.20,
    "complexity":  0.15,
    "quality":     0.10,
    "docs":        0.05,
}


def rank_personalized(
    recommendations: list[dict],
    profile: dict,
) -> list[dict]:
    """
    Re-rank a list of repo recommendation dicts using the personalized scoring formula.

    Args:
        recommendations: List of rec dicts from the RAG engine (already contain relevance_score).
        profile: UserProfile dict with experience, goal, language, languages, complexity, project_types.

    Returns:
        List of dicts sorted by personalized_score descending, each enriched with
        personalized_score, score_breakdown, explanation_reasons, rank.
    """
    experience = profile.get("experience", "intermediate")
    complexity = profile.get("complexity", "moderate")

    enriched = []
    for rec in recommendations:
        semantic   = float(rec.get("relevance_score", 0.5))
        experience_s = _experience_match(rec, experience)
        complexity_s = _complexity_fit(rec, complexity)
        quality_s    = _repo_quality(rec)
        docs_s       = _doc_quality(rec)

        final = (
            semantic     * WEIGHTS["semantic"]   +
            experience_s * WEIGHTS["experience"] +
            complexity_s * WEIGHTS["complexity"] +
            quality_s    * WEIGHTS["quality"]    +
            docs_s       * WEIGHTS["docs"]
        )

        breakdown = {
            "semantic_similarity": round(semantic, 3),
            "experience_match":    round(experience_s, 3),
            "complexity_fit":      round(complexity_s, 3),
            "repo_quality":        round(quality_s, 3),
            "doc_quality":         round(docs_s, 3),
            "final_score":         round(final, 3),
        }

        reasons = build_explanation_card(rec, profile, breakdown)

        enriched.append({
            **rec,
            "personalized_score": round(final, 3),
            "score_breakdown": breakdown,
            "explanation_reasons": reasons,
        })

    enriched.sort(key=lambda x: x["personalized_score"], reverse=True)
    for i, item in enumerate(enriched):
        item["rank"] = i + 1

    logger.info(
        f"Personalized ranking complete: {len(enriched)} repos, "
        f"top score={enriched[0]['personalized_score'] if enriched else 'N/A'}"
    )
    return enriched
