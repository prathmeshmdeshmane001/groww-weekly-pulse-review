"""Phase 3 — Pulse assembly and validation tests."""
from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

import pytest

from assembly.models import RenderedPulse
from assembly.pulse_builder import count_words, render_pulse
from assembly.validator import validate_pulse
from pipeline.models import Pulse, Theme

REFERENCE_DATE = datetime(2026, 7, 28, tzinfo=timezone.utc)


def _make_pulse() -> Pulse:
    return Pulse(
        top_themes=[
            Theme(name="onboarding", review_count=10, summary="Onboarding is hard."),
            Theme(name="payments", review_count=8, summary="Payments fail."),
            Theme(name="withdrawals", review_count=5, summary="Withdrawals are slow."),
        ],
        quotes=[
            "SIP investment failed due to timeout error",
            "Withdrawal was fast and smooth",
            "KYC video verification keeps crashing",
        ],
        action_ideas=[
            "1. Simplify KYC video verification with in-app guidance.",
            "2. Add smart payment retry logic with clearer error messages.",
            "3. Show real-time withdrawal tracking with estimated arrival time.",
        ],
        review_count=23,
        week_of=datetime(2026, 7, 27).date(),
    )


def test_render_pulse_produces_markdown() -> None:
    pulse = _make_pulse()
    markdown = render_pulse(pulse)
    assert markdown.startswith("# Weekly Pulse - Groww App")
    assert "Week of: 2026-07-27" in markdown
    assert "Reviews analysed: 23" in markdown
    assert "## Top Themes This Week" in markdown
    assert "## What Users Are Saying" in markdown
    assert "## Recommended Actions" in markdown


def test_render_pulse_no_unfilled_placeholders() -> None:
    pulse = _make_pulse()
    markdown = render_pulse(pulse)
    assert "{" not in markdown
    assert "}" not in markdown


def test_render_pulse_requires_three_themes() -> None:
    pulse = _make_pulse()
    pulse.top_themes = pulse.top_themes[:2]
    markdown = render_pulse(pulse)
    result = validate_pulse(pulse, markdown)
    assert result.validated is False
    assert any("Expected 3 themes" in err for err in result.validation_errors)


def test_render_pulse_requires_three_quotes() -> None:
    pulse = _make_pulse()
    pulse.quotes = pulse.quotes[:2]
    markdown = render_pulse(pulse)
    result = validate_pulse(pulse, markdown)
    assert result.validated is False
    assert any("Expected 3 quotes" in err for err in result.validation_errors)


def test_render_pulse_requires_three_actions() -> None:
    pulse = _make_pulse()
    pulse.action_ideas = pulse.action_ideas[:2]
    markdown = render_pulse(pulse)
    result = validate_pulse(pulse, markdown)
    assert result.validated is False
    assert any("Expected 3 action ideas" in err for err in result.validation_errors)


def test_count_words() -> None:
    assert count_words("hello world test") == 3
    assert count_words("") == 0
    assert count_words("  spaced  out  ") == 2


def test_validate_pulse_passes_valid() -> None:
    pulse = _make_pulse()
    markdown = render_pulse(pulse)
    result = validate_pulse(pulse, markdown)
    assert result.validated is True
    assert result.validation_errors == []
    assert result.word_count <= 250


def test_validate_pulse_word_count_exceeds_limit() -> None:
    pulse = _make_pulse()
    markdown = render_pulse(pulse)
    long_markdown = markdown + " " + "word " * 300
    result = validate_pulse(pulse, long_markdown)
    assert result.validated is False
    assert any("Word count" in err for err in result.validation_errors)


def test_validate_pulse_pii_in_quotes() -> None:
    pulse = _make_pulse()
    pulse.quotes[0] = "Contact me at user@example.com for help"
    markdown = render_pulse(pulse)
    result = validate_pulse(pulse, markdown)
    assert result.validated is False
    assert any("PII" in err for err in result.validation_errors)


def test_validate_pulse_short_quote() -> None:
    pulse = _make_pulse()
    pulse.quotes[0] = "bad"
    markdown = render_pulse(pulse)
    result = validate_pulse(pulse, markdown)
    assert result.validated is False
    assert any("too short" in err for err in result.validation_errors)


def test_validate_pulse_empty_quote() -> None:
    pulse = _make_pulse()
    pulse.quotes[0] = ""
    markdown = render_pulse(pulse)
    result = validate_pulse(pulse, markdown)
    assert result.validated is False
    assert any("empty or too short" in err for err in result.validation_errors)


def test_validate_pulse_unfilled_placeholders() -> None:
    pulse = _make_pulse()
    bad_markdown = "# Weekly Pulse\nWeek of: {week_of}\n"
    result = validate_pulse(pulse, bad_markdown)
    assert result.validated is False
    assert any("placeholders" in err for err in result.validation_errors)


def test_validate_pulse_wrong_theme_count() -> None:
    pulse = _make_pulse()
    pulse.top_themes = pulse.top_themes[:1]
    markdown = render_pulse(pulse)
    result = validate_pulse(pulse, markdown)
    assert result.validated is False
    assert any("Expected 3 themes" in err for err in result.validation_errors)


def test_validate_pulse_wrong_quote_count() -> None:
    pulse = _make_pulse()
    pulse.quotes = pulse.quotes[:1]
    markdown = render_pulse(pulse)
    result = validate_pulse(pulse, markdown)
    assert result.validated is False
    assert any("Expected 3 quotes" in err for err in result.validation_errors)


def test_validate_pulse_wrong_action_count() -> None:
    pulse = _make_pulse()
    pulse.action_ideas = pulse.action_ideas[:1]
    markdown = render_pulse(pulse)
    result = validate_pulse(pulse, markdown)
    assert result.validated is False
    assert any("Expected 3 action ideas" in err for err in result.validation_errors)


def test_render_pulse_integration(monkeypatch: pytest.MonkeyPatch) -> None:
    from pipeline.pipeline import run_ai_pipeline
    from ingestion.models import Review
    from datetime import timedelta

    def _make_review(review_id: str, text: str, rating: int = 4, days_ago: int = 7) -> Review:
        return Review(
            id=review_id,
            source="app_store",
            rating=rating,
            title="Title",
            text=text,
            date=REFERENCE_DATE - timedelta(days=days_ago),
            pii_stripped=True,
        )

    def _mock_llm(prompt: str, **kwargs):
        lowered = prompt.lower()
        if "allowed themes" in lowered or "theme names" in lowered:
            import re
            review_lines = re.findall(r"^\d+\.\s+.+$", prompt, re.MULTILINE)
            count = len(review_lines) or 1
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

    monkeypatch.setattr("pipeline.theme_engine.generate_with_retry", _mock_llm)
    monkeypatch.setattr("pipeline.action_generator.generate_with_retry", _mock_llm)

    reviews = [_make_review(f"r{i}", f"Review text {i}", rating=i % 3 + 1) for i in range(30)]
    pulse = run_ai_pipeline(reviews)
    markdown = render_pulse(pulse)
    result = validate_pulse(pulse, markdown)
    assert result.validated is True
    assert result.word_count <= 250
