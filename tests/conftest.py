"""Shared pytest fixtures."""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

import pytest

from config import load_settings

FIXTURES_DIR = Path(__file__).parent / "fixtures"
REFERENCE_DATE = datetime(2026, 7, 28, tzinfo=timezone.utc)


@pytest.fixture
def settings():
    return load_settings()


@pytest.fixture
def reference_date():
    return REFERENCE_DATE
