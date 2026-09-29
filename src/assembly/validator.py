"""Hard constraint validation for rendered pulses."""
from __future__ import annotations

from typing import Any

from assembly.models import RenderedPulse
from assembly.pulse_builder import count_words
from ingestion.pii_stripper import contains_pii
from pipeline.models import Pulse


def validate_pulse(pulse: Pulse, markdown_text: str) -> RenderedPulse:
    errors: list[str] = []
    word_count = count_words(markdown_text)

    if word_count > 250:
        errors.append(f"Word count {word_count} exceeds limit of 250")

    if len(pulse.top_themes) != 3:
        errors.append(f"Expected 3 themes, got {len(pulse.top_themes)}")
    if len(pulse.quotes) != 3:
        errors.append(f"Expected 3 quotes, got {len(pulse.quotes)}")
    if len(pulse.action_ideas) != 3:
        errors.append(f"Expected 3 action ideas, got {len(pulse.action_ideas)}")

    for idx, quote in enumerate(pulse.quotes, 1):
        if not quote or len(quote.strip()) <= 10:
            errors.append(f"Quote {idx} is empty or too short (<= 10 chars)")
        if contains_pii(quote):
            errors.append(f"Quote {idx} contains PII pattern")

    if "{" in markdown_text and "}" in markdown_text:
        errors.append("Rendered output contains unfilled template placeholders")

    validated = len(errors) == 0
    return RenderedPulse(
        markdown_text=markdown_text,
        word_count=word_count,
        validated=validated,
        validation_errors=errors,
        week_of=pulse.week_of,
    )
