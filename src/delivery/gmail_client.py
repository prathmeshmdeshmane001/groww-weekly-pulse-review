"""Gmail MCP client for draft creation."""
from __future__ import annotations

import logging
from typing import Any

from config import load_settings
from delivery.mcp import call_mcp_tool
from assembly.models import RenderedPulse

logger = logging.getLogger(__name__)


def create_draft(doc_url: str, rendered: RenderedPulse) -> str:
    settings = load_settings()
    week_of = rendered.week_of
    subject = settings.delivery.draft_subject_format.format(
        year=week_of.year,
        week=week_of.isocalendar().week,
        week_date=week_of.isoformat(),
    )

    body = (
        f"{rendered.markdown_text}\n\n"
        f"Full doc: {doc_url}"
    )

    logger.info("Creating Gmail draft for %s", settings.delivery.recipient_email)
    result = call_mcp_tool(
        "gmail",
        "create_draft",
        {
            "to": settings.delivery.recipient_email,
            "subject": subject,
            "body": body,
        },
    )

    draft_id = result.get("draft_id") or result.get("id") or ""
    if not draft_id:
        raise ValueError(f"Gmail MCP response missing draft ID: {result}")

    logger.info("Gmail draft created: %s", draft_id)
    return draft_id
