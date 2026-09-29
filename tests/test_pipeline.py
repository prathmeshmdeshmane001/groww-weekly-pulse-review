"""Phase 2 AI pipeline tests."""
from __future__ import annotations

import logging
import re
from datetime import datetime, timedelta, timezone

import pytest

from config import load_settings
from exceptions import InsufficientDataError
from ingestion.models import Review
from pipeline.models import Pulse, Theme
from pipeline.pipeline import run_ai_pipeline
from pipeline.theme_engine import cluster_reviews, generate_summaries, rank_themes
from pipeline.quote_selector import select_quotes
from pipeline.action_generator import generate_actions

REFERENCE_DATE = datetime(2026, 7, 28, tzinfo=timezone.utc)


def _make_review(
    *,
    review_id: str = "test-1",
    source: str = "app_store",
    rating: int = 4,
    title: str | None = "Title",
    text: str = "Sample review text",
    days_ago: int = 7,
) -> Review:
    return Review(
        id=review_id,
        source=source,
        rating=rating,
        title=title,
        text=text,
        date=REFERENCE_DATE - timedelta(days=days_ago),
        pii_stripped=True,
    )


def _mock_llm(prompt: str, **kwargs):
    lowered = prompt.lower()
    if "allowed themes" in lowered or "theme names" in lowered:
        review_lines = re.findall(r"^\d+\.\s+.+$", prompt, re.MULTILINE)
        count = len(review_lines)
        if count == 0:
            count = 1
        themes = ["onboarding", "payments", "withdrawals", "statements", "kyc"]
        return "\n".join(themes[i % len(themes)] for i in range(count))
    if "1-sentence summary" in lowered:
        return (
            "Onboarding friction is the top pain point this week.\n"
            "Payment reliability issues rank second.\n"
            "Withdrawal speed continues to lag."
        )
    if "actionable improvement" in lowered or "product improvement" in lowered:
        return (
            "1. Simplify KYC video verification with in-app guidance and live support.\n"
            "2. Add smart payment retry logic with clearer error messages for failed transactions.\n"
            "3. Show real-time withdrawal tracking with estimated arrival time and SMS alerts."
        )
    return "other"


def _patch_llm(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("pipeline.theme_engine.generate_with_retry", _mock_llm)
    monkeypatch.setattr("pipeline.action_generator.generate_with_retry", _mock_llm)


def test_cluster_reviews_batches(monkeypatch: pytest.MonkeyPatch) -> None:
    reviews = [_make_review(review_id=f"r{i}", text=f"Review text {i}") for i in range(25)]
    monkeypatch.setattr("pipeline.theme_engine.generate_with_retry", _mock_llm)
    settings = load_settings()
    result = cluster_reviews(reviews, batch_size=10)
    assert sum(len(v) for v in result.values()) == 25


def test_cluster_reviews_parses_assignments(monkeypatch: pytest.MonkeyPatch) -> None:
    reviews = [_make_review(review_id="r1", text="Great app")]
    monkeypatch.setattr(
        "pipeline.theme_engine.generate_with_retry", lambda prompt, **kw: "onboarding"
    )
    settings = load_settings()
    result = cluster_reviews(reviews, batch_size=20)
    assert result["onboarding"] == reviews


def test_cluster_reviews_warns_on_other_dominance(
    monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    reviews = [_make_review(review_id=f"r{i}", text=f"Review text {i}") for i in range(20)]

    def mock_llm(prompt: str, **kwargs):
        return "\n".join(["other"] * 20)

    monkeypatch.setattr("pipeline.theme_engine.generate_with_retry", mock_llm)
    with caplog.at_level(logging.WARNING):
        result = cluster_reviews(reviews, batch_size=20)
    assert any("'other' bucket" in record.message for record in caplog.records)


def test_rank_themes_weighted(monkeypatch: pytest.MonkeyPatch) -> None:
    r1 = _make_review(review_id="r1", rating=1, text="Bad")
    r2 = _make_review(review_id="r2", rating=1, text="Bad")
    r3 = _make_review(review_id="r3", rating=5, text="Good")
    themes_map = {
        "onboarding": [r1, r3],
        "payments": [r2],
        "withdrawals": [],
        "statements": [],
        "kyc": [],
        "other": [],
    }
    top = rank_themes(themes_map)
    assert [t.name for t in top] == ["onboarding", "payments", "kyc"]
    assert top[0].review_count == 2
    assert top[1].review_count == 1


def test_rank_themes_tiebreak_alphabetical(monkeypatch: pytest.MonkeyPatch) -> None:
    r = _make_review(review_id="r1", rating=3, text="Ok")
    themes_map = {
        "onboarding": [r],
        "payments": [r],
        "withdrawals": [r],
        "statements": [],
        "kyc": [],
        "other": [],
    }
    top = rank_themes(themes_map)
    assert [t.name for t in top] == ["onboarding", "payments", "withdrawals"]


def test_rank_themes_insufficient() -> None:
    themes_map = {
        "onboarding": [_make_review(review_id="r1")],
        "payments": [],
        "other": [],
    }
    with pytest.raises(ValueError, match="Insufficient named themes"):
        rank_themes(themes_map)


def test_select_quotes_prefers_specific(monkeypatch: pytest.MonkeyPatch) -> None:
    generic = _make_review(review_id="r1", text="the app is bad", rating=1)
    specific = _make_review(review_id="r2", text="SIP investment failed due to timeout error", rating=1)
    themes_map = {"onboarding": [generic, specific]}
    top_themes = [Theme(name="onboarding", review_count=2, summary="")]
    quotes = select_quotes(top_themes, themes_map)
    assert quotes[0] == "SIP investment failed due to timeout error"


def test_select_quotes_pii_scan(monkeypatch: pytest.MonkeyPatch) -> None:
    clean = _make_review(review_id="r1", text="Withdrawal was fast and smooth", rating=5)
    pii = _make_review(review_id="r2", text="Email me at user@example.com for help", rating=5)
    themes_map = {"payments": [clean, pii]}
    top_themes = [Theme(name="payments", review_count=2, summary="")]
    quotes = select_quotes(top_themes, themes_map)
    assert quotes[0] == "Withdrawal was fast and smooth"


def test_select_quotes_empty_fallback(monkeypatch: pytest.MonkeyPatch) -> None:
    themes_map = {"withdrawals": []}
    top_themes = [Theme(name="withdrawals", review_count=0, summary="")]
    quotes = select_quotes(top_themes, themes_map)
    assert quotes[0] == ""


def test_generate_actions_parses_numbered(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("pipeline.action_generator.generate_with_retry", _mock_llm)
    pulse = Pulse(
        top_themes=[
            Theme(name="onboarding", review_count=10, summary="Onboarding is hard."),
            Theme(name="payments", review_count=8, summary="Payments fail."),
            Theme(name="withdrawals", review_count=5, summary="Withdrawals are slow."),
        ],
        quotes=["Q1", "Q2", "Q3"],
        action_ideas=[],
        review_count=23,
        week_of=datetime(2026, 7, 27).date(),
    )
    actions = generate_actions(pulse)
    assert len(actions) == 3
    assert all(a.startswith(("1.", "2.", "3.")) for a in actions)


def test_run_ai_pipeline_integration(monkeypatch: pytest.MonkeyPatch) -> None:
    reviews = [
        _make_review(review_id=f"r{i}", text=f"Review text {i}", rating=i % 3 + 1)
        for i in range(30)
    ]
    _patch_llm(monkeypatch)
    pulse = run_ai_pipeline(reviews)
    assert len(pulse.top_themes) == 3
    assert len(pulse.quotes) == 3
    assert len(pulse.action_ideas) == 3
    assert pulse.review_count == 30
    assert pulse.week_of == datetime(2026, 7, 20).date()


def test_run_ai_pipeline_structural_validation(monkeypatch: pytest.MonkeyPatch) -> None:
    reviews = [_make_review(review_id=f"r{i}", text=f"Review text {i}") for i in range(30)]
    _patch_llm(monkeypatch)
    pulse = run_ai_pipeline(reviews)
    assert len(pulse.top_themes) == 3
    assert len(pulse.quotes) == 3
    assert len(pulse.action_ideas) == 3
    assert all(q for q in pulse.quotes)
    assert all(a for a in pulse.action_ideas)


def test_run_ai_pipeline_insufficient_reviews(monkeypatch: pytest.MonkeyPatch) -> None:
    reviews = [_make_review(review_id=f"r{i}", text=f"Review text {i}") for i in range(5)]
    _patch_llm(monkeypatch)
    with pytest.raises(InsufficientDataError):
        run_ai_pipeline(reviews)
