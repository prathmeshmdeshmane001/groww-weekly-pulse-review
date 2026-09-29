"""Fetch and store public App Store and Google Play Store reviews."""

from __future__ import annotations

import csv
import json
import logging
import time
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import google_play_scraper

logger = logging.getLogger(__name__)

GROWW_PLAY_STORE_PACKAGE = "com.nextbillion.groww"
GROWW_APP_STORE_ID = "1404871703"

PLAY_STORE_CSV_HEADERS = [
    "Review ID",
    "Star Rating",
    "Review",
    "Review Submit Date and Time",
    "Reviewer Name",
]

APP_STORE_CSV_HEADERS = [
    "Review ID",
    "Rating",
    "Title",
    "Review Text",
    "Review Date",
    "Reviewer Name",
]


def fetch_app_store_reviews(
    app_id: str = GROWW_APP_STORE_ID,
    *,
    lookback_weeks: int = 12,
    country: str = "in",
    max_pages: int = 10,
    reference_date: datetime | None = None,
) -> list[dict[str, Any]]:
    """
    Fetch public reviews for an iOS app via Apple's public iTunes RSS feed.
    Apple provides up to 10 pages (~500 reviews) per RSS feed.
    """
    if reference_date is None:
        reference_date = datetime.now(timezone.utc)
    elif reference_date.tzinfo is None:
        reference_date = reference_date.replace(tzinfo=timezone.utc)
    else:
        reference_date = reference_date.astimezone(timezone.utc)

    cutoff = reference_date - timedelta(weeks=lookback_weeks)
    reviews: list[dict[str, Any]] = []

    logger.info("Fetching App Store reviews (ID: %s, lookback: %d weeks)...", app_id, lookback_weeks)

    for page in range(1, max_pages + 1):
        url = (
            f"https://itunes.apple.com/{country}/rss/customerreviews/"
            f"page={page}/id={app_id}/sortby=mostrecent/json"
        )
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"},
        )
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode("utf-8"))
        except Exception as exc:
            logger.warning("Failed to fetch App Store page %d: %s", page, exc)
            break

        feed = data.get("feed", {})
        entries = feed.get("entry", [])
        if not entries:
            break

        for entry in entries:
            # First entry on page 1 may be app metadata rather than a review
            if "im:rating" not in entry:
                continue

            r_id = entry.get("id", {}).get("label", "")
            rating = entry.get("im:rating", {}).get("label", "")
            title = entry.get("title", {}).get("label", "")
            text = entry.get("content", {}).get("label", "")
            date_str = entry.get("updated", {}).get("label", "")
            author = entry.get("author", {}).get("name", {}).get("label", "")

            # Check cutoff date
            if date_str:
                try:
                    parsed_date = datetime.fromisoformat(date_str)
                    if parsed_date.tzinfo is None:
                        parsed_date = parsed_date.replace(tzinfo=timezone.utc)
                    else:
                        parsed_date = parsed_date.astimezone(timezone.utc)
                    if parsed_date < cutoff:
                        continue
                except ValueError:
                    pass

            reviews.append({
                "Review ID": r_id,
                "Rating": rating,
                "Title": title,
                "Review Text": text,
                "Review Date": date_str,
                "Reviewer Name": author,
            })

    logger.info("Fetched %d App Store reviews", len(reviews))
    return reviews


def fetch_play_store_reviews(
    app_package: str = GROWW_PLAY_STORE_PACKAGE,
    *,
    lookback_weeks: int = 12,
    country: str = "in",
    lang: str = "en",
    batch_size: int = 200,
    max_reviews: int = 10000,
    reference_date: datetime | None = None,
) -> list[dict[str, Any]]:
    """
    Fetch public reviews for an Android app via Google Play Store scraper
    spanning the lookback period.
    """
    if reference_date is None:
        reference_date = datetime.now(timezone.utc)
    elif reference_date.tzinfo is None:
        reference_date = reference_date.replace(tzinfo=timezone.utc)
    else:
        reference_date = reference_date.astimezone(timezone.utc)

    cutoff = reference_date - timedelta(weeks=lookback_weeks)
    reviews: list[dict[str, Any]] = []
    continuation_token: Any = None
    batch_num = 0

    logger.info(
        "Fetching Play Store reviews (Package: %s, lookback: %d weeks, cutoff: %s)...",
        app_package,
        lookback_weeks,
        cutoff.strftime("%Y-%m-%d"),
    )

    while len(reviews) < max_reviews:
        batch_num += 1
        try:
            result, continuation_token = google_play_scraper.reviews(
                app_package,
                lang=lang,
                country=country,
                sort=google_play_scraper.Sort.NEWEST,
                count=batch_size,
                continuation_token=continuation_token,
            )
        except Exception as exc:
            logger.warning("Error fetching Play Store batch %d: %s", batch_num, exc)
            break

        if not result:
            break

        reached_cutoff = False
        for r in result:
            r_date: datetime = r.get("at")
            if r_date is not None:
                if r_date.tzinfo is None:
                    r_date = r_date.replace(tzinfo=timezone.utc)
                else:
                    r_date = r_date.astimezone(timezone.utc)

                if r_date < cutoff:
                    reached_cutoff = True
                    break

            reviews.append({
                "Review ID": r.get("reviewId", ""),
                "Star Rating": r.get("score", ""),
                "Review": r.get("content", ""),
                "Review Submit Date and Time": r_date.strftime("%Y-%m-%d %H:%M:%S") if r_date else "",
                "Reviewer Name": r.get("userName", ""),
            })

            if len(reviews) >= max_reviews:
                break

        if reached_cutoff or not continuation_token:
            break

        time.sleep(0.1)

    logger.info("Fetched %d Play Store reviews across %d batches", len(reviews), batch_num)
    return reviews


def save_to_csv(rows: list[dict[str, Any]], fieldnames: list[str], output_file: Path) -> None:
    """Save rows to CSV with header."""
    output_file.parent.mkdir(parents=True, exist_ok=True)
    with output_file.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    logger.info("Saved %d rows to %s", len(rows), output_file)


def download_and_store_reviews(
    output_dir: Path | str = "data/raw",
    *,
    lookback_weeks: int = 12,
    play_package: str = GROWW_PLAY_STORE_PACKAGE,
    app_store_id: str = GROWW_APP_STORE_ID,
    max_play_reviews: int = 10000,
    country: str = "in",
    lang: str = "en",
) -> dict[str, int]:
    """
    Download reviews for both platforms spanning 8-12 weeks and store them as CSVs.
    """
    out_path = Path(output_dir)
    if not out_path.is_absolute():
        project_root = Path(__file__).resolve().parent.parent.parent
        out_path = project_root / out_path

    out_path.mkdir(parents=True, exist_ok=True)

    # 1. App Store
    app_store_reviews = fetch_app_store_reviews(
        app_id=app_store_id,
        lookback_weeks=lookback_weeks,
        country=country,
    )
    app_store_file = out_path / "app_store_reviews.csv"
    save_to_csv(app_store_reviews, APP_STORE_CSV_HEADERS, app_store_file)

    # 2. Play Store
    play_store_reviews = fetch_play_store_reviews(
        app_package=play_package,
        lookback_weeks=lookback_weeks,
        country=country,
        lang=lang,
        max_reviews=max_play_reviews,
    )
    play_store_file = out_path / "play_store_reviews.csv"
    save_to_csv(play_store_reviews, PLAY_STORE_CSV_HEADERS, play_store_file)

    return {
        "app_store": len(app_store_reviews),
        "play_store": len(play_store_reviews),
    }
