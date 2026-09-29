"""Google Docs MCP client for idempotent pulse publishing."""
from __future__ import annotations

import logging
from datetime import date
from typing import Any

from config import load_settings
from delivery.mcp import call_mcp_tool
from assembly.models import RenderedPulse

logger = logging.getLogger(__name__)


def _doc_title_for_week(week_of: date, settings) -> str:
    year = week_of.year
    week = week_of.isocalendar().week
    return settings.delivery.doc_title_format.format(year=year, week=week, week_date=week_of.isoformat())


def _find_existing_doc(title: str, settings) -> str | None:
    try:
        result = call_mcp_tool(
            "google-docs",
            "list_documents",
            {"query": title},
        )
        docs = result.get("documents", [])
        for doc in docs:
            if doc.get("title") == title:
                return doc.get("id")
    except Exception as exc:
        logger.warning("Could not list documents: %s", exc)
    return None


def create_or_update_document(rendered: RenderedPulse) -> str:
    settings = load_settings()
    title = _doc_title_for_week(rendered.week_of, settings)

    doc_id = _find_existing_doc(title, settings)
    if doc_id:
        logger.info("Updating existing Google Doc: %s (id=%s)", title, doc_id)
        result = call_mcp_tool(
            "google-docs",
            "update_document",
            {
                "document_id": doc_id,
                "content": rendered.markdown_text,
            },
        )
    else:
        logger.info("Creating new Google Doc: %s", title)
        result = call_mcp_tool(
            "google-docs",
            "create_document",
            {
                "title": title,
                "content": rendered.markdown_text,
            },
        )

    doc_url = result.get("url") or result.get("document_url") or ""
    if not doc_url:
        raise ValueError(f"Google Docs MCP response missing URL: {result}")

    logger.info("Google Doc ready: %s", doc_url)
    return doc_url
