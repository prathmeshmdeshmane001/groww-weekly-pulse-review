#!/usr/bin/env python3
"""Production HTTP API Server for Groww Weekly Pulse Review (Render & Local)."""

from __future__ import annotations

import json
import logging
import os
import sys
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlparse

# Ensure src/ is on sys.path when invoked as `python src/server.py`
SRC_DIR = Path(__file__).resolve().parent
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from ingestion.fetcher import (
    GROWW_APP_STORE_ID,
    GROWW_PLAY_STORE_PACKAGE,
    fetch_app_store_reviews,
    fetch_play_store_reviews,
)
from ingestion.models import Review
from ingestion.pii_stripper import strip_review_text
from ingestion.text_cleaner import count_words, is_english, remove_emojis

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("pulse_api_server")


def detect_theme(text: str) -> str:
    """Classify a sanitized review into its primary Groww product theme."""
    t = f" {text.lower()} "
    scores = {
        "Charges & Fees": sum(
            1
            for k in [
                "charge",
                "fee",
                "brokerage",
                "hidden",
                "cost",
                " rs ",
                "rs.",
                "₹",
                "rupee",
                "maintenance",
                "gst",
                "cut money",
                "deduct",
                "dp charge",
                "penalty",
                "auto square",
            ]
            if k in t
        ),
        "App Performance": sum(
            1
            for k in [
                "lag",
                "slow",
                "crash",
                "freeze",
                "bug",
                "glitch",
                "chart",
                "update",
                "stuck",
                "performance",
                "loading",
                "speed",
                "battery",
                "hanging",
                "black screen",
                "server",
                "down",
                "error",
            ]
            if k in t
        ),
        "Customer Support": sum(
            1
            for k in [
                "support",
                "customer service",
                "customer care",
                "helpdesk",
                "agent",
                "ticket",
                "helpline",
                "contact",
                "call",
                "response",
                "email support",
                "phone number",
                "complaint",
                "resolve",
            ]
            if k in t
        ),
        "Payments": sum(
            1
            for k in [
                "payment",
                "upi",
                "gpay",
                "phonepe",
                "autopay",
                "mandate",
                "deposit",
                "add money",
                "net banking",
                "sip",
                "deduction",
                "failed payment",
                "bank",
            ]
            if k in t
        ),
        "KYC & Onboarding": sum(
            1
            for k in [
                "kyc",
                "aadhaar",
                "aadhar",
                "pan",
                "onboarding",
                "document",
                "verify",
                "verification",
                "digilocker",
                "selfie",
                "account open",
                "sign up",
                "login",
                "otp",
            ]
            if k in t
        ),
        "Withdrawals": sum(
            1
            for k in [
                "withdraw",
                "withdrawal",
                "payout",
                "bank transfer",
                "uncredited",
                "settlement",
                "credit in bank",
                "funds transfer",
            ]
            if k in t
        ),
        "Statements": sum(
            1
            for k in [
                "statement",
                "p&l",
                "profit",
                "loss",
                "tax",
                "report",
                "contract note",
                "capital gain",
                "download",
                "pdf",
                "excel",
                "ledger",
                "invoice",
                "portfolio",
            ]
            if k in t
        ),
    }
    best_theme, best_score = max(scores.items(), key=lambda item: item[1])
    return best_theme if best_score > 0 else "General & Usability"


def fetch_and_clean_live_reviews(
    *,
    lookback_weeks: int = 10,
    max_play_reviews: int = 400,
    max_app_pages: int = 2,
) -> dict[str, Any]:
    """Fetch live reviews from Play Store and App Store, strip PII, and classify themes."""
    raw_play = fetch_play_store_reviews(
        GROWW_PLAY_STORE_PACKAGE,
        lookback_weeks=lookback_weeks,
        batch_size=200,
        max_reviews=max_play_reviews,
    )
    raw_app = fetch_app_store_reviews(
        GROWW_APP_STORE_ID,
        lookback_weeks=lookback_weeks,
        max_pages=max_app_pages,
    )

    domain_reviews: list[Review] = []

    for row in raw_play:
        text = remove_emojis(str(row.get("Review") or ""))
        if not text or count_words(text) <= 6 or not is_english(text):
            continue
        try:
            rating = int(float(row.get("Star Rating") or 0))
        except ValueError:
            continue
        if not (1 <= rating <= 5):
            continue
        date_str = str(row.get("Review Submit Date and Time") or "")
        try:
            dt = datetime.strptime(date_str, "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
        except ValueError:
            dt = datetime.now(timezone.utc)
        domain_reviews.append(
            Review(
                id=str(row.get("Review ID") or ""),
                source="play_store",
                rating=rating,
                title=None,
                text=text,
                date=dt,
                pii_stripped=False,
            )
        )

    for row in raw_app:
        text = remove_emojis(str(row.get("Review Text") or ""))
        if not text or count_words(text) <= 6 or not is_english(text):
            continue
        try:
            rating = int(float(row.get("Rating") or 0))
        except ValueError:
            continue
        if not (1 <= rating <= 5):
            continue
        date_str = str(row.get("Review Date") or "")
        try:
            dt = datetime.fromisoformat(date_str)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            else:
                dt = dt.astimezone(timezone.utc)
        except ValueError:
            dt = datetime.now(timezone.utc)
        title = remove_emojis(str(row.get("Title") or "")) or None
        domain_reviews.append(
            Review(
                id=str(row.get("Review ID") or ""),
                source="app_store",
                rating=rating,
                title=title,
                text=text,
                date=dt,
                pii_stripped=False,
            )
        )

    # Strip PII via Phase 1 sanitizer
    strip_review_text(domain_reviews)
    domain_reviews.sort(key=lambda r: r.date, reverse=True)

    play_count = sum(1 for r in domain_reviews if r.source == "play_store")
    app_count = sum(1 for r in domain_reviews if r.source == "app_store")

    serialized = [
        {
            "id": r.id,
            "rating": r.rating,
            "title": r.title,
            "text": r.text,
            "date": r.date.strftime("%b %d, %Y"),
            "source": "Play Store" if r.source == "play_store" else "App Store",
            "theme": detect_theme(r.text),
            "sentiment": "Positive" if r.rating >= 4 else ("Neutral" if r.rating == 3 else "Negative"),
            "pii_stripped": r.pii_stripped,
        }
        for r in domain_reviews
    ]

    return {
        "success": True,
        "fetchedAt": datetime.now(timezone.utc).isoformat(),
        "playCount": play_count,
        "appCount": app_count,
        "totalCount": len(serialized),
        "count": len(serialized),
        "reviews": serialized,
    }


class PulseAPIRequestHandler(BaseHTTPRequestHandler):
    """HTTP Request Handler with CORS for the Groww Weekly Pulse Backend."""

    def _send_json(self, status_code: int, payload: dict[str, Any]) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:  # noqa: N802
        self._send_json(200, {"ok": True})

    def do_GET(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/") or "/"
        query = parse_qs(parsed.query)

        if path in ("/", "/health", "/api/health"):
            self._send_json(
                200,
                {
                    "status": "ok",
                    "service": "groww-weekly-pulse-backend",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "endpoints": ["/health", "/api/live-reviews"],
                },
            )
            return

        if path == "/api/live-reviews":
            try:
                batches = min(5, max(1, int(query.get("batches", ["2"])[0])))
                weeks = min(52, max(1, int(query.get("weeks", ["10"])[0])))
                payload = fetch_and_clean_live_reviews(
                    lookback_weeks=weeks,
                    max_play_reviews=batches * 200,
                    max_app_pages=2,
                )
                self._send_json(200, payload)
            except Exception as exc:
                logger.exception("Error in /api/live-reviews")
                self._send_json(
                    500,
                    {
                        "success": False,
                        "error": str(exc),
                        "reviews": [],
                    },
                )
            return

        self._send_json(404, {"error": f"Not found: {path}"})


def main() -> None:
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "8000"))
    server = ThreadingHTTPServer((host, port), PulseAPIRequestHandler)
    logger.info("Groww Weekly Pulse API Server listening on http://%s:%d", host, port)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("Shutting down server...")
        server.server_close()


if __name__ == "__main__":
    main()
