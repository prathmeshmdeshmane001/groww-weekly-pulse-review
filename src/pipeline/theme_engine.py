"""Theme clustering, ranking, and summary generation."""

from __future__ import annotations

import json
import logging
import re
import time

from config import load_settings
from ingestion.models import Review
from pipeline.llm_client import generate_with_retry
from pipeline.models import Theme

logger = logging.getLogger(__name__)


def sample_reviews(reviews: list[Review], max_count: int = 1000) -> list[Review]:
    """Sample up to max_count reviews with stratified rating representation."""
    if len(reviews) <= max_count:
        return reviews

    sorted_reviews = sorted(reviews, key=lambda r: r.date, reverse=True)
    by_rating: dict[int, list[Review]] = {r: [] for r in range(1, 6)}
    for review in sorted_reviews:
        by_rating.setdefault(review.rating, []).append(review)

    sampled: list[Review] = []
    ratio = max_count / len(reviews)
    for _, group in by_rating.items():
        quota = max(1, int(len(group) * ratio))
        sampled.extend(group[:quota])

    if len(sampled) < max_count:
        sampled_ids = {r.id for r in sampled}
        remaining = [r for r in sorted_reviews if r.id not in sampled_ids]
        sampled.extend(remaining[: (max_count - len(sampled))])

    logger.info("Sampled %d reviews from %d total normalized reviews", len(sampled[:max_count]), len(reviews))
    return sampled[:max_count]


def _build_cluster_prompt(batch: list[Review], allowed_themes: list[str]) -> str:
    theme_list = ", ".join(f'"{t}"' for t in allowed_themes + ["other"])
    reviews_block = "\n".join(
        f"{i + 1}. {' '.join(r.text.split())[:250]}" for i, r in enumerate(batch)
    )
    return (
        "You are a review classification assistant for the Groww fintech app.\n"
        f"Allowed themes: [{theme_list}]\n\n"
        f"Classify each of the following {len(batch)} reviews into exactly one allowed theme:\n"
        f"{reviews_block}\n\n"
        f"Return ONLY a valid JSON array of exactly {len(batch)} strings corresponding to each review in order."
    )


def _parse_assignments(raw: str, expected_count: int, allowed_themes: list[str] | None = None) -> list[str]:
    cleaned = raw.replace("```json", "").replace("```", "").strip()
    allowed = allowed_themes or ["onboarding", "KYC", "payments", "statements", "withdrawals"]
    theme_lookup = {t.lower(): t for t in allowed}
    theme_lookup["other"] = "other"

    # Try JSON parsing first
    try:
        parsed = json.loads(cleaned)
        if isinstance(parsed, list):
            assignments = []
            for item in parsed[:expected_count]:
                t_str = str(item).strip().lower()
                matched = theme_lookup.get(t_str, "other")
                assignments.append(matched)
            if len(assignments) < expected_count:
                assignments.extend(["other"] * (expected_count - len(assignments)))
            return assignments
    except Exception:
        pass

    # Line-by-line fallback parsing
    lines = [line.strip() for line in cleaned.splitlines() if line.strip()]
    assignments = []
    for line in lines[:expected_count]:
        cleaned_line = re.sub(r"^(?:\d+[\.\)]\s*|[-\*]\s*)", "", line).strip().lower()
        matched = theme_lookup.get(cleaned_line, "other")
        assignments.append(matched)

    if len(assignments) < expected_count:
        logger.warning(
            "LLM returned fewer assignments (%d) than reviews (%d). Padding with 'other'.",
            len(assignments),
            expected_count,
        )
        assignments.extend(["other"] * (expected_count - len(assignments)))

    return assignments


def cluster_reviews(reviews: list[Review], batch_size: int | None = None) -> dict[str, list[Review]]:
    settings = load_settings()
    max_reviews = settings.ingestion.max_reviews_to_process
    reviews_to_cluster = sample_reviews(reviews, max_count=max_reviews)

    batch_size = batch_size if batch_size is not None else settings.llm.batch_size
    delay_seconds = settings.llm.request_delay_seconds
    allowed = settings.themes.allowed
    themes: dict[str, list[Review]] = {t: [] for t in allowed}
    themes["other"] = []

    total_batches = (len(reviews_to_cluster) + batch_size - 1) // batch_size
    logger.info("Clustering %d reviews across %d batches...", len(reviews_to_cluster), total_batches)

    for i in range(0, len(reviews_to_cluster), batch_size):
        batch = reviews_to_cluster[i : i + batch_size]
        batch_idx = (i // batch_size) + 1
        prompt = _build_cluster_prompt(batch, allowed)
        raw = generate_with_retry(
            prompt,
            temperature=settings.llm.temperature,
            max_output_tokens=settings.llm.max_output_tokens,
            response_mime_type="application/json",
        )
        assignments = _parse_assignments(raw, len(batch), allowed)

        for review, theme in zip(batch, assignments):
            if theme in themes:
                themes[theme].append(review)
            else:
                themes["other"].append(review)

        # Rate-limiting delay between batch requests to respect TPM / RPM limits
        if i + batch_size < len(reviews_to_cluster) and delay_seconds > 0:
            time.sleep(delay_seconds)

    other_count = len(themes.get("other", []))
    for name in allowed:
        if other_count > len(themes.get(name, [])):
            logger.warning(
                "'other' bucket (%d) exceeds theme '%s' count (%d); review theme taxonomy.",
                other_count,
                name,
                len(themes.get(name, [])),
            )

    return themes


def rank_themes(themes: dict[str, list[Review]]) -> list[Theme]:
    weights = {1: 3, 2: 2, 3: 1, 4: 1, 5: 1}
    scored: list[tuple[str, int, int]] = []

    for name, reviews in themes.items():
        if name == "other":
            continue
        weighted = sum(weights.get(r.rating, 1) for r in reviews)
        scored.append((name, len(reviews), weighted))

    scored.sort(key=lambda x: (-x[2], x[0]))
    top = scored[:3]

    if len(top) < 3:
        raise ValueError(f"Insufficient named themes for top-3 selection: got {len(top)}")

    return [
        Theme(name=name, review_count=count, summary="")
        for name, count, _ in top
    ]


def generate_summaries(top_themes: list[Theme], reviews_by_theme: dict[str, list[Review]]) -> list[Theme]:
    if not top_themes:
        return top_themes

    blocks = []
    for idx, theme in enumerate(top_themes, 1):
        reviews = reviews_by_theme.get(theme.name, [])[:5]
        snippets = "\n".join(f"- {r.text[:200]}" for r in reviews)
        blocks.append(f"{idx}. Theme: {theme.name}\nUser quotes:\n{snippets}")

    prompt = (
        "Generate a 1-sentence summary for each theme below, based on the user quotes.\n"
        "Be specific to the app domain. Do not exceed 1 sentence per theme.\n\n"
        + "\n\n".join(blocks)
        + "\n\nRespond with exactly 3 lines, one summary per theme, in order."
    )

    raw = generate_with_retry(prompt, temperature=0.3, max_output_tokens=512)
    summaries = [line.strip() for line in raw.strip().splitlines() if line.strip()]

    # Clean leading numbers if any
    cleaned_summaries = []
    for s in summaries:
        cleaned_summaries.append(re.sub(r"^(?:\d+[\.\)]\s*|[-\*]\s*)", "", s).strip())

    while len(cleaned_summaries) < len(top_themes):
        cleaned_summaries.append(f"User feedback regarding {top_themes[len(cleaned_summaries)].name}.")

    result = []
    for theme, summary in zip(top_themes, cleaned_summaries[: len(top_themes)]):
        result.append(Theme(name=theme.name, review_count=theme.review_count, summary=summary))

    return result
