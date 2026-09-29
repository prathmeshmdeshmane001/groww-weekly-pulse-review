"""Pulse assembly and validation."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import Literal


@dataclass
class RenderedPulse:
    markdown_text: str
    word_count: int
    validated: bool
    validation_errors: list[str]
    week_of: date
