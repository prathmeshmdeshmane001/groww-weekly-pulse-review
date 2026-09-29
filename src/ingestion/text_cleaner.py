"""Text cleaning, emoji stripping, and language validation for review normalization."""

from __future__ import annotations

import logging
import re
from typing import Final

try:
    import langdetect
    from langdetect import DetectorFactory

    DetectorFactory.seed = 0
    _LANGDETECT_AVAILABLE = True
except ImportError:
    _LANGDETECT_AVAILABLE = False

logger = logging.getLogger(__name__)

# Pattern covering Unicode emojis, symbols, pictographs, dingbats, variation selectors, zero-width joiners
EMOJI_PATTERN: Final[re.Pattern] = re.compile(
    r"[\U00010000-\U0010ffff]|"
    r"[\u2600-\u27BF]|"
    r"[\u2300-\u23FF]|"
    r"[\u2B50-\u2B55]|"
    r"[\u200D\uFE0E\uFE0F]",
    flags=re.UNICODE,
)


def remove_emojis(text: str | None) -> str:
    """Remove emojis, symbols, and pictographs from text and collapse extra whitespace."""
    if not text:
        return ""
    cleaned = EMOJI_PATTERN.sub("", text)
    return " ".join(cleaned.split())


def is_english(text: str) -> bool:
    """
    Check whether a text is written in English.
    Rejects non-Latin scripts (Devanagari, Arabic, Cyrillic, Chinese, etc.)
    and uses langdetect for natural language detection.
    """
    if not text or not text.strip():
        return False

    letters = [c for c in text if c.isalpha()]
    if not letters:
        return False

    # Reject if less than 80% of alphabetic characters are ASCII Latin
    ascii_letters = [c for c in letters if ord(c) < 128]
    if len(ascii_letters) / len(letters) < 0.8:
        return False

    if _LANGDETECT_AVAILABLE:
        try:
            detected = langdetect.detect(text)
            return detected == "en"
        except Exception:
            return False

    return True


def count_words(text: str) -> int:
    """Count whitespace-separated words in text."""
    if not text:
        return 0
    return len(text.split())
