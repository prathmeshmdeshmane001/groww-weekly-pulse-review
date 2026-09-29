"""Phase 4 — MCP delivery tests."""
from __future__ import annotations

import json
from datetime import date, datetime, timedelta, timezone
from unittest.mock import MagicMock

import pytest

from config import load_settings
from assembly.models import RenderedPulse
from assembly.pulse_builder import render_pulse
from delivery.docs_client import create_or_update_document, _doc_title_for_week
from delivery.gmail_client import create_draft
from delivery.mcp import MCPConnectionError, call_mcp_tool
from pipeline.models import Pulse, Theme

REFERENCE_DATE = datetime(2026, 7, 28, tzinfo=timezone.utc)


def _make_rendered() -> RenderedPulse:
    pulse = Pulse(
        top_themes=[
            Theme(name="onboarding", review_count=10, summary="Onboarding is hard."),
            Theme(name="payments", review_count=8, summary="Payments fail."),
            Theme(name="withdrawals", review_count=5, summary="Withdrawals are slow."),
        ],
        quotes=["SIP investment failed due to timeout error", "Withdrawal was fast and smooth", "KYC video verification keeps crashing"],
        action_ideas=[
            "1. Simplify KYC video verification with in-app guidance.",
            "2. Add smart payment retry logic with clearer error messages.",
            "3. Show real-time withdrawal tracking with estimated arrival time.",
        ],
        review_count=23,
        week_of=datetime(2026, 7, 27).date(),
    )
    markdown = render_pulse(pulse)
    return RenderedPulse(
        markdown_text=markdown,
        word_count=len(markdown.split()),
        validated=True,
        validation_errors=[],
        week_of=pulse.week_of,
    )


def test_doc_title_format() -> None:
    settings = load_settings()
    title = _doc_title_for_week(date(2026, 7, 27), settings)
    assert title == "Weekly Pulse - Groww App | 2026-W31"


def test_create_or_update_document_creates_new(monkeypatch: pytest.MonkeyPatch) -> None:
    rendered = _make_rendered()
    calls = []

    def mock_call(server, tool, arguments):
        calls.append((server, tool, arguments))
        if tool == "list_documents":
            return {"documents": []}
        if tool == "create_document":
            return {"url": "https://docs.google.com/document/d/abc123"}
        raise ValueError(f"Unexpected tool: {tool}")

    monkeypatch.setattr("delivery.docs_client.call_mcp_tool", mock_call)
    doc_url = create_or_update_document(rendered)
    assert doc_url == "https://docs.google.com/document/d/abc123"
    assert calls[0] == ("google-docs", "list_documents", {"query": "Weekly Pulse - Groww App | 2026-W31"})
    assert calls[1][0] == "google-docs"
    assert calls[1][1] == "create_document"


def test_create_or_update_document_updates_existing(monkeypatch: pytest.MonkeyPatch) -> None:
    rendered = _make_rendered()
    calls = []

    def mock_call(server, tool, arguments):
        calls.append((server, tool, arguments))
        if tool == "list_documents":
            return {"documents": [{"title": "Weekly Pulse - Groww App | 2026-W31", "id": "existing-123"}]}
        if tool == "update_document":
            return {"url": "https://docs.google.com/document/d/existing-123"}
        raise ValueError(f"Unexpected tool: {tool}")

    monkeypatch.setattr("delivery.docs_client.call_mcp_tool", mock_call)
    doc_url = create_or_update_document(rendered)
    assert doc_url == "https://docs.google.com/document/d/existing-123"
    assert calls[1] == ("google-docs", "update_document", {"document_id": "existing-123", "content": rendered.markdown_text})


def test_create_or_update_document_missing_url(monkeypatch: pytest.MonkeyPatch) -> None:
    rendered = _make_rendered()

    def mock_call(server, tool, arguments):
        if tool == "list_documents":
            return {"documents": []}
        if tool == "create_document":
            return {"title": "Weekly Pulse - Groww App | 2026-W31"}
        raise ValueError(f"Unexpected tool: {tool}")

    monkeypatch.setattr("delivery.docs_client.call_mcp_tool", mock_call)
    with pytest.raises(ValueError, match="missing URL"):
        create_or_update_document(rendered)


def test_gmail_draft_creation(monkeypatch: pytest.MonkeyPatch) -> None:
    rendered = _make_rendered()
    calls = []

    def mock_call(server, tool, arguments):
        calls.append((server, tool, arguments))
        if tool == "create_draft":
            assert arguments["to"] == "you@example.com"
            assert arguments["subject"] == "Weekly Pulse - Groww App | Week of 2026-07-27"
            assert "Full doc:" in arguments["body"]
            return {"draft_id": "draft-xyz"}
        raise ValueError(f"Unexpected tool: {tool}")

    monkeypatch.setattr("delivery.gmail_client.call_mcp_tool", mock_call)
    draft_id = create_draft("https://docs.google.com/document/d/abc123", rendered)
    assert draft_id == "draft-xyz"
    assert calls[0][1] == "create_draft"


def test_gmail_draft_missing_id(monkeypatch: pytest.MonkeyPatch) -> None:
    rendered = _make_rendered()

    def mock_call(server, tool, arguments):
        if tool == "create_draft":
            return {"status": "ok"}
        raise ValueError(f"Unexpected tool: {tool}")

    monkeypatch.setattr("delivery.gmail_client.call_mcp_tool", mock_call)
    with pytest.raises(ValueError, match="missing draft ID"):
        create_draft("https://docs.google.com/document/d/abc123", rendered)


def test_mcp_connection_error() -> None:
    with pytest.raises(MCPConnectionError):
        call_mcp_tool("google-docs", "create_document", {"title": "test", "content": "test"})


def test_run_phase_4_integration(monkeypatch: pytest.MonkeyPatch) -> None:
    from src.main import run_phase_4
    from pipeline.pipeline import run_ai_pipeline
    from pipeline.models import Pulse, Theme
    from assembly.pulse_builder import render_pulse
    from assembly.validator import validate_pulse
    from ingestion.models import Review
    from ingestion.review_loader import load_reviews

    settings = load_settings()

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

    reviews = [_make_review(f"r{i}", f"Review text {i}", rating=i % 3 + 1) for i in range(30)]

    short_pulse = Pulse(
        top_themes=[
            Theme(name="onboarding", review_count=10, summary="Onboarding is hard."),
            Theme(name="payments", review_count=8, summary="Payments fail."),
            Theme(name="withdrawals", review_count=5, summary="Withdrawals are slow."),
        ],
        quotes=["SIP failed badly", "Withdrawal fast", "KYC crash loop"],
        action_ideas=["1. Fix onboarding", "2. Fix payments", "3. Fix withdrawals"],
        review_count=30,
        week_of=datetime(2026, 7, 27).date(),
    )

    def mock_run_ai(revs):
        return short_pulse

    monkeypatch.setattr("src.main.run_ai_pipeline", mock_run_ai)
    monkeypatch.setattr("ingestion.review_loader.load_reviews", lambda settings=None, **kw: reviews)

    doc_calls = []
    gmail_calls = []

    def mock_docs_mcp(server, tool, arguments):
        doc_calls.append((server, tool, arguments))
        if tool == "list_documents":
            return {"documents": []}
        if tool == "create_document":
            return {"url": "https://docs.google.com/document/d/new-123"}
        raise ValueError(f"Unexpected tool: {tool}")

    def mock_gmail_mcp(server, tool, arguments):
        gmail_calls.append((server, tool, arguments))
        if tool == "create_draft":
            return {"draft_id": "draft-456"}
        raise ValueError(f"Unexpected tool: {tool}")

    monkeypatch.setattr("delivery.docs_client.call_mcp_tool", mock_docs_mcp)
    monkeypatch.setattr("delivery.gmail_client.call_mcp_tool", mock_gmail_mcp)

    exit_code = run_phase_4()
    assert exit_code == 0
    assert len(doc_calls) == 2
    assert len(gmail_calls) == 1
    assert gmail_calls[0][2]["to"] == "you@example.com"
