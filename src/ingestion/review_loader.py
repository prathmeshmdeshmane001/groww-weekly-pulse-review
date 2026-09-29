"""Load, normalize, and date-filter raw app store review exports."""

from __future__ import annotations

import csv
import json
import logging
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Literal

from config import IngestionConfig, Settings, load_settings
from exceptions import InsufficientDataError
from ingestion.models import Review
from ingestion.pii_stripper import strip_review_text
from ingestion.text_cleaner import count_words, is_english, remove_emojis

logger = logging.getLogger(__name__)

SourceType = Literal["app_store", "play_store"]

DATE_FORMATS = (
    "%Y-%m-%d",
    "%Y-%m-%d %H:%M:%S",
    "%Y-%m-%dT%H:%M:%S",
    "%Y-%m-%dT%H:%M:%SZ",
    "%Y-%m-%dT%H:%M:%S%z",
    "%m/%d/%Y",
    "%m/%d/%Y %H:%M:%S",
    "%d/%m/%Y",
    "%d/%m/%Y %H:%M:%S",
    "%b %d, %Y",
    "%B %d, %Y",
)

SOURCE_FILE_PATTERNS: dict[SourceType, tuple[str, ...]] = {
    "app_store": ("*app_store*.csv", "*appstore*.csv", "*ios*.csv"),
    "play_store": ("*play_store*.csv", "*playstore*.csv", "*android*.csv"),
}


def _project_root() -> Path:
    return Path(__file__).resolve().parent.parent.parent


def _resolve_raw_dir(config: IngestionConfig) -> Path:
    raw_dir = Path(config.raw_data_dir)
    if not raw_dir.is_absolute():
        raw_dir = _project_root() / raw_dir
    return raw_dir


def _parse_date(value: str) -> datetime | None:
    """Parse a date string using common export formats."""
    cleaned = value.strip()
    if not cleaned:
        return None

    if cleaned.endswith("Z"):
        cleaned = cleaned[:-1] + "+00:00"

    for fmt in DATE_FORMATS:
        try:
            parsed = datetime.strptime(cleaned, fmt)
            if parsed.tzinfo is None:
                parsed = parsed.replace(tzinfo=timezone.utc)
            return parsed.astimezone(timezone.utc)
        except ValueError:
            continue

    try:
        parsed = datetime.fromisoformat(cleaned)
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed.astimezone(timezone.utc)
    except ValueError:
        return None


def _load_rows(path: Path) -> list[dict[str, Any]]:
    """Load raw rows from a CSV or JSON export file."""
    suffix = path.suffix.lower()

    if suffix == ".csv":
        with path.open(encoding="utf-8-sig", newline="") as handle:
            reader = csv.DictReader(handle)
            return [dict(row) for row in reader]

    if suffix == ".json":
        with path.open(encoding="utf-8") as handle:
            payload = json.load(handle)

        if isinstance(payload, list):
            return [row for row in payload if isinstance(row, dict)]

        if isinstance(payload, dict):
            for key in ("reviews", "data", "items"):
                nested = payload.get(key)
                if isinstance(nested, list):
                    return [row for row in nested if isinstance(row, dict)]

        raise ValueError(f"Unsupported JSON structure in {path}")

    raise ValueError(f"Unsupported file format: {path.suffix}")


def _drop_fields(row: dict[str, Any], fields: list[str]) -> dict[str, Any]:
    """Remove PII-related columns before normalization."""
    cleaned = dict(row)
    for field in fields:
        cleaned.pop(field, None)
    return cleaned


def _get_field(row: dict[str, Any], column: str | None) -> str | None:
    if column is None:
        return None
    value = row.get(column)
    if value is None or str(value).strip() == "":
        return None
    return str(value).strip()


def _normalize_row(
    row: dict[str, Any],
    *,
    source: SourceType,
    row_index: int,
    mapping: Any,
) -> Review | None:
    """Convert a raw export row into a Review, or None if the row should be skipped."""
    cleaned = _drop_fields(row, mapping.drop_fields)

    raw_text = _get_field(cleaned, mapping.text)
    rating_raw = _get_field(cleaned, mapping.rating)
    date_raw = _get_field(cleaned, mapping.date)

    if not raw_text:
        logger.warning("Row %d skipped: missing review text", row_index)
        return None

    # Clean emojis from review text
    text = remove_emojis(raw_text)
    if not text:
        logger.debug("Row %d skipped: review text empty after emoji removal", row_index)
        return None

    # Filter: must have more than 6 words (at least 7 words)
    words = count_words(text)
    if words <= 6:
        logger.debug(
            "Row %d skipped: review has %d words (requires more than 6 words)",
            row_index,
            words,
        )
        return None

    # Filter: must be English language
    if not is_english(text):
        logger.debug("Row %d skipped: non-English language review", row_index)
        return None

    if rating_raw is None:
        logger.warning("Row %d skipped: missing rating", row_index)
        return None

    try:
        rating = int(float(rating_raw))
    except ValueError:
        logger.warning("Row %d skipped: invalid rating %r", row_index, rating_raw)
        return None

    if not (1 <= rating <= 5):
        logger.warning("Row %d skipped: rating out of range %r", row_index, rating)
        return None

    if date_raw is None:
        logger.warning("Row %d skipped: missing date", row_index)
        return None

    parsed_date = _parse_date(date_raw)
    if parsed_date is None:
        logger.warning(
            "Row %d skipped: unparseable date %r",
            row_index,
            date_raw,
        )
        return None

    review_id = _get_field(cleaned, mapping.id) or str(uuid.uuid4())
    raw_title = _get_field(cleaned, mapping.title)
    title = remove_emojis(raw_title) if raw_title else None
    if title == "":
        title = None

    return Review(
        id=review_id,
        source=source,
        rating=rating,
        title=title,
        text=text,
        date=parsed_date,
        pii_stripped=False,
    )


def filter_by_date(
    reviews: list[Review],
    lookback_weeks: int,
    *,
    reference_date: datetime | None = None,
) -> list[Review]:
    """Keep reviews within the configured lookback window (inclusive boundary)."""
    if reference_date is None:
        reference_date = datetime.now(timezone.utc)
    elif reference_date.tzinfo is None:
        reference_date = reference_date.replace(tzinfo=timezone.utc)
    else:
        reference_date = reference_date.astimezone(timezone.utc)

    cutoff = reference_date - timedelta(weeks=lookback_weeks)
    return [review for review in reviews if review.date >= cutoff]


def load_file(path: Path, source: SourceType, settings: Settings) -> list[Review]:
    """Load and normalize reviews from a single export file."""
    if not path.exists():
        raise FileNotFoundError(f"Review export not found: {path}")

    mapping = settings.ingestion.column_mappings[source]
    rows = _load_rows(path)
    reviews: list[Review] = []

    for index, row in enumerate(rows, start=1):
        review = _normalize_row(row, source=source, row_index=index, mapping=mapping)
        if review is not None:
            reviews.append(review)

    return reviews


def discover_source_files(raw_dir: Path, source: SourceType) -> list[Path]:
    """Find export files for a configured source under the raw data directory."""
    patterns = SOURCE_FILE_PATTERNS[source]
    matches: list[Path] = []

    for pattern in patterns:
        matches.extend(raw_dir.glob(pattern))

    json_matches = list(raw_dir.glob(f"*{source}*.json"))
    matches.extend(json_matches)

    unique = sorted({path.resolve() for path in matches if path.is_file()})
    return unique


def load_reviews(
    settings: Settings | None = None,
    *,
    reference_date: datetime | None = None,
) -> list[Review]:
    """
    Load all configured sources, filter by date, strip PII, and enforce minimum count.
    This is the Phase 1 output contract: List[Review] with pii_stripped=True.
    """
    if settings is None:
        settings = load_settings()

    config = settings.ingestion
    raw_dir = _resolve_raw_dir(config)
    if not raw_dir.exists():
        raise FileNotFoundError(f"Raw data directory not found: {raw_dir}")

    all_reviews: list[Review] = []

    for source in config.sources:
        files = discover_source_files(raw_dir, source)
        if not files:
            logger.warning("No export files found for source '%s' in %s", source, raw_dir)
            continue

        for path in files:
            logger.info("Loading %s reviews from %s", source, path.name)
            all_reviews.extend(load_file(path, source, settings))

    filtered = filter_by_date(
        all_reviews,
        config.lookback_weeks,
        reference_date=reference_date,
    )
    strip_review_text(filtered)

    if len(filtered) < config.min_reviews_required:
        raise InsufficientDataError(len(filtered), config.min_reviews_required)

    return filtered
