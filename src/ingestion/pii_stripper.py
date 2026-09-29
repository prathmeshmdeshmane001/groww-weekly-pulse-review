"""Regex-based PII redaction for review text fields."""

from __future__ import annotations

import re

EMAIL_PATTERN = re.compile(
    r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"
)
URL_PATTERN = re.compile(
    r"https?://[^\s<>\"']+|www\.[^\s<>\"']+",
    re.IGNORECASE,
)
DEVICE_PATTERN = re.compile(
    r"\b(?:iPhone|iPad|Samsung|Galaxy|Pixel|OnePlus|Redmi|Xiaomi|"
    r"Oppo|Vivo|Realme|Motorola|Nokia|Huawei|Honor)\s[\w\s\-+()]{0,30}\b",
    re.IGNORECASE,
)


def redact_text(text: str) -> str:
    """Replace PII patterns in review text with safe placeholders."""
    redacted = EMAIL_PATTERN.sub("[REDACTED]", text)
    redacted = URL_PATTERN.sub("[LINK]", redacted)
    redacted = DEVICE_PATTERN.sub("", redacted)
    return re.sub(r"\s{2,}", " ", redacted).strip()


def strip_review_text(reviews: list) -> list:
    """
    Apply regex redaction to each review's text and mark pii_stripped=True.
    Mutates reviews in place and returns the same list.
    """
    from ingestion.models import Review

    for review in reviews:
        if not isinstance(review, Review):
            raise TypeError("strip_review_text expects Review instances")

        review.text = redact_text(review.text)
        review.pii_stripped = True

    return reviews


def contains_pii(text: str) -> bool:
    """Return True if text still matches any PII pattern (for validation scans)."""
    return bool(
        EMAIL_PATTERN.search(text)
        or URL_PATTERN.search(text)
        or DEVICE_PATTERN.search(text)
    )
