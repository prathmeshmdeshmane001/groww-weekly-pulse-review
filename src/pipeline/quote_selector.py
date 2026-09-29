"""Quote selection for top themes."""
from __future__ import annotations

import logging

from ingestion.models import Review
from ingestion.pii_stripper import contains_pii
from pipeline.models import Theme

logger = logging.getLogger(__name__)


def _score_quote(text: str) -> int:
    words = text.split()
    word_count = len(words)
    
    # Target ideal quote length between 8 and 30 words to respect overall 250-word Pulse budget
    if 10 <= word_count <= 28:
        score = 100
    elif 6 <= word_count < 10:
        score = 60
    elif 28 < word_count <= 40:
        score = 40
    else:
        score = 10

    specific_indicators = [
        "sip",
        "kyc",
        "withdrawal",
        "withdraw",
        "payment",
        "statement",
        "portfolio",
        "login",
        "signup",
        "otp",
        "upi",
        "bank",
        "invest",
        "redeem",
        "bug",
        "crash",
        "error",
        "slow",
        "fail",
        "pending",
        "delay",
        "charges",
        "refund",
    ]
    lower = text.lower()
    for indicator in specific_indicators:
        if indicator in lower:
            score += 25
    return score


def select_quotes(top_themes: list[Theme], reviews_by_theme: dict[str, list[Review]]) -> list[str]:
    quotes: list[str] = []
    for theme in top_themes:
        candidates = reviews_by_theme.get(theme.name, [])
        valid = []
        for review in candidates:
            if contains_pii(review.text):
                continue
            if len(review.text.strip()) < 10:
                continue
            valid.append(review)

        if not valid:
            logger.warning("No valid quotes found for theme '%s'", theme.name)
            quotes.append("")
            continue

        valid.sort(key=lambda r: _score_quote(r.text), reverse=True)
        quotes.append(valid[0].text)

    return quotes
