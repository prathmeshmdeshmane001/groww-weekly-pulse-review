"""Theme and Pulse dataclasses for the AI pipeline."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date


@dataclass
class Theme:
    name: str
    review_count: int
    summary: str


@dataclass
class Pulse:
    top_themes: list[Theme]
    quotes: list[str]
    action_ideas: list[str]
    review_count: int
    week_of: date
