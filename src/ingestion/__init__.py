"""Phase 1 — Data ingestion and parsing."""

from ingestion.fetcher import (
    download_and_store_reviews,
    fetch_app_store_reviews,
    fetch_play_store_reviews,
)
from ingestion.models import Review
from ingestion.pii_stripper import contains_pii, redact_text, strip_review_text
from ingestion.review_loader import (
    discover_source_files,
    filter_by_date,
    load_file,
    load_reviews,
)
from ingestion.text_cleaner import count_words, is_english, remove_emojis

__all__ = [
    "Review",
    "contains_pii",
    "count_words",
    "discover_source_files",
    "download_and_store_reviews",
    "fetch_app_store_reviews",
    "fetch_play_store_reviews",
    "filter_by_date",
    "is_english",
    "load_file",
    "load_reviews",
    "redact_text",
    "remove_emojis",
    "strip_review_text",
]
