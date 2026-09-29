"""
models.py
Unified data models shared across all pipeline stages.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Literal


@dataclass
class Review:
    """
    Unified review schema produced by the ingestion layer.
    All fields are normalised from store-specific export formats.
    PII is stripped before this object is used downstream.
    """

    id: str                                        # UUID assigned at load time
    source: Literal["app_store", "play_store"]     # origin store
    rating: int                                    # 1-5 star rating
    title: str | None                              # None if store does not provide title
    text: str                                      # review body (PII-redacted after stripping)
    date: datetime                                 # timezone-aware UTC datetime
    pii_stripped: bool = False                     # set to True after pii_stripper runs

    def __post_init__(self) -> None:
        if not (1 <= self.rating <= 5):
            raise ValueError(f"Rating must be 1-5, got {self.rating}")
        if not self.text or not self.text.strip():
            raise ValueError("Review text cannot be empty")