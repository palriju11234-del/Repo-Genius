"""
LLM Client — Groq API wrapper with retry and graceful fallback.
"""
import logging
import time
from typing import Any

from backend.config import settings

logger = logging.getLogger(__name__)


def _get_client():
    from groq import Groq
    return Groq(api_key=settings.groq_api_key)


def generate(
    system_prompt: str,
    user_message: str,
    max_retries: int = 3,
) -> str:
    """
    Generate a response from Groq.
    Falls back to a plain text summary if the API is unavailable.

    Returns:
        Generated text string.
    """
    if not settings.groq_api_key:
        logger.warning("GROQ_API_KEY not set — returning raw context summary")
        return _fallback_summary(user_message)

    delay = 2.0

    for attempt in range(1, max_retries + 1):
        try:
            client = _get_client()
            completion = client.chat.completions.create(
                model=settings.groq_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message},
                ],
                temperature=0.4,
                max_tokens=2048,
                top_p=0.95,
            )
            return completion.choices[0].message.content or ""
        except Exception as e:
            err = str(e)
            logger.warning(f"Groq attempt {attempt}/{max_retries} failed: {err}")
            
            # Immediately fall back on quota limit (429) errors to prevent browser request hangs
            if "429" in err or "quota" in err.lower() or "rate_limit" in err.lower():
                logger.error("Groq API rate/quota limit exceeded (429) — immediately falling back to local database summary")
                return _fallback_summary(user_message)
                
            if attempt < max_retries:
                time.sleep(delay)
                delay *= 2
            else:
                logger.error("All Groq retries exhausted — falling back")
                return _fallback_summary(user_message)

    return _fallback_summary(user_message)


def _fallback_summary(user_message: str) -> str:
    """Return a basic text summary when Groq is unavailable."""
    lines = user_message.split("\n")
    repo_lines = [l for l in lines if l.startswith("Name:") or l.startswith("URL:") or l.startswith("Description:")]
    summary = "Here are the most relevant repositories found:\n\n" + "\n".join(repo_lines[:30])
    return summary
