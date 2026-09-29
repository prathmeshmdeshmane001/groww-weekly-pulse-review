"""Phase 1 ingestion unit tests."""

from __future__ import annotations

import csv
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest

from config import Settings, load_settings
from exceptions import InsufficientDataError
from ingestion.models import Review
from ingestion.pii_stripper import contains_pii, redact_text, strip_review_text
from ingestion.review_loader import filter_by_date, load_file, load_reviews
from ingestion.text_cleaner import count_words, is_english, remove_emojis

FIXTURES_DIR = Path(__file__).parent / "fixtures"
REFERENCE_DATE = datetime(2026, 7, 28, tzinfo=timezone.utc)


def _make_review(
    *,
    review_id: str = "test-1",
    source: str = "app_store",
    rating: int = 4,
    title: str | None = "Title",
    text: str = "Sample review text containing more than six words",
    days_ago: int = 7,
) -> Review:
    return Review(
        id=review_id,
        source=source,  # type: ignore[arg-type]
        rating=rating,
        title=title,
        text=text,
        date=REFERENCE_DATE - timedelta(days=days_ago),
        pii_stripped=False,
    )


def test_parse_appstore_csv(settings: Settings) -> None:
    reviews = load_file(FIXTURES_DIR / "app_store_sample.csv", "app_store", settings)

    assert len(reviews) == 3
    first = reviews[0]
    assert first.source == "app_store"
    assert first.rating == 5
    assert first.title == "Great app"
    assert first.text == "Love the SIP feature easy to use for investing"
    assert first.date == datetime(2026, 7, 20, tzinfo=timezone.utc)


def test_parse_playstore_csv(settings: Settings) -> None:
    reviews = load_file(FIXTURES_DIR / "play_store_sample.csv", "play_store", settings)

    assert len(reviews) == 3
    first = reviews[0]
    assert first.source == "play_store"
    assert first.rating == 4
    assert first.title is None
    assert first.text == "Withdrawal was very fast and smooth for me"


def test_missing_title_field(settings: Settings) -> None:
    reviews = load_file(FIXTURES_DIR / "play_store_sample.csv", "play_store", settings)
    assert all(review.title is None for review in reviews)


def test_date_filter_includes(settings: Settings) -> None:
    reviews = [
        _make_review(review_id="recent", days_ago=8 * 7),
    ]
    filtered = filter_by_date(
        reviews,
        settings.ingestion.lookback_weeks,
        reference_date=REFERENCE_DATE,
    )
    assert len(filtered) == 1


def test_date_filter_excludes(settings: Settings) -> None:
    reviews = [
        _make_review(review_id="old", days_ago=14 * 7),
    ]
    filtered = filter_by_date(
        reviews,
        settings.ingestion.lookback_weeks,
        reference_date=REFERENCE_DATE,
    )
    assert filtered == []


def test_date_filter_boundary() -> None:
    reviews = [
        _make_review(review_id="boundary", days_ago=12 * 7),
    ]
    filtered = filter_by_date(reviews, 12, reference_date=REFERENCE_DATE)
    assert len(filtered) == 1


def test_pii_email_redacted() -> None:
    redacted = redact_text("Please email me at user@gmail.com for help")
    assert "[REDACTED]" in redacted
    assert "user@gmail.com" not in redacted
    assert not contains_pii(redacted)


def test_pii_username_stripped(settings: Settings) -> None:
    reviews = load_file(FIXTURES_DIR / "play_store_sample.csv", "play_store", settings)
    for review in reviews:
        assert not hasattr(review, "reviewer_name")
        payload = review.__dict__
        assert "reviewer_name" not in payload
        assert "Reviewer Name" not in payload


def test_empty_export(tmp_path: Path, settings: Settings) -> None:
    empty_csv = tmp_path / "empty.csv"
    empty_csv.write_text("Review ID,Rating,Title,Review Text,Review Date\n", encoding="utf-8")

    reviews = load_file(empty_csv, "app_store", settings)
    assert reviews == []


def test_malformed_date(tmp_path: Path, settings: Settings, caplog: pytest.LogCaptureFixture) -> None:
    bad_csv = tmp_path / "bad_dates.csv"
    with bad_csv.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=["Review ID", "Rating", "Title", "Review Text", "Review Date"],
        )
        writer.writeheader()
        writer.writerow(
            {
                "Review ID": "bad-1",
                "Rating": "4",
                "Title": "Broken date",
                "Review Text": "This is valid text with more than six words in it",
                "Review Date": "not-a-real-date",
            }
        )

    with caplog.at_level("WARNING"):
        reviews = load_file(bad_csv, "app_store", settings)

    assert reviews == []
    assert any("unparseable date" in record.message for record in caplog.records)


def test_strip_review_text_sets_flag() -> None:
    review = _make_review(text="Please contact user@example.com for assistance with your account")
    strip_review_text([review])
    assert review.pii_stripped is True
    assert "user@example.com" not in review.text


def test_load_reviews_insufficient_data(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    settings = load_settings()
    settings.ingestion.raw_data_dir = str(tmp_path)
    settings.ingestion.min_reviews_required = 30

    sample = tmp_path / "app_store_sample.csv"
    sample.write_text(
        (FIXTURES_DIR / "app_store_sample.csv").read_text(encoding="utf-8"),
        encoding="utf-8",
    )

    with pytest.raises(InsufficientDataError) as exc_info:
        load_reviews(settings, reference_date=REFERENCE_DATE)

    assert exc_info.value.count < 30


def test_file_not_found(settings: Settings) -> None:
    missing = FIXTURES_DIR / "does_not_exist.csv"
    with pytest.raises(FileNotFoundError):
        load_file(missing, "app_store", settings)


def test_remove_emojis() -> None:
    text_with_emojis = "Great app! Love using it \U0001f44d\U0001f44d for SIP investments \U0001f680"
    cleaned = remove_emojis(text_with_emojis)
    assert cleaned == "Great app! Love using it for SIP investments"
    assert remove_emojis("") == ""
    assert remove_emojis(None) == ""


def test_is_english() -> None:
    assert is_english("This is a clean and helpful review about stock trading.")
    assert is_english("Great mutual fund investment experience with fast withdrawal process.")
    assert not is_english("बहुत अच्छा ऐप है ट्रेडिंग के लिए")
    assert not is_english("bahut accha app hai invest karne ke liye mujhe pasand aaya")
    assert not is_english("")


def test_count_words() -> None:
    assert count_words("one two three four five six seven") == 7
    assert count_words("just six words in this review") == 6
    assert count_words("") == 0


def test_normalize_filters_short_reviews(tmp_path: Path, settings: Settings) -> None:
    csv_file = tmp_path / "short_reviews.csv"
    with csv_file.open("w", encoding="utf-8", newline="") as h:
        writer = csv.DictWriter(
            h,
            fieldnames=["Review ID", "Rating", "Title", "Review Text", "Review Date"],
        )
        writer.writeheader()
        # 4 words -> should be skipped (<= 6 words)
        writer.writerow({
            "Review ID": "1",
            "Rating": "5",
            "Title": "Good",
            "Review Text": "Very nice app here",
            "Review Date": "2026-07-20",
        })
        # 6 words -> should be skipped (<= 6 words)
        writer.writerow({
            "Review ID": "2",
            "Rating": "5",
            "Title": "Good",
            "Review Text": "One two three four five six",
            "Review Date": "2026-07-20",
        })
        # 7 words -> kept (> 6 words)
        writer.writerow({
            "Review ID": "3",
            "Rating": "5",
            "Title": "Good",
            "Review Text": "One two three four five six seven",
            "Review Date": "2026-07-20",
        })

    reviews = load_file(csv_file, "app_store", settings)
    assert len(reviews) == 1
    assert reviews[0].id == "3"


def test_normalize_filters_non_english(tmp_path: Path, settings: Settings) -> None:
    csv_file = tmp_path / "non_english.csv"
    with csv_file.open("w", encoding="utf-8", newline="") as h:
        writer = csv.DictWriter(
            h,
            fieldnames=["Review ID", "Rating", "Title", "Review Text", "Review Date"],
        )
        writer.writeheader()
        # Hindi Devanagari -> skipped
        writer.writerow({
            "Review ID": "hi-1",
            "Rating": "5",
            "Title": "अच्छा",
            "Review Text": "यह ऐप बहुत अच्छा है निवेश करने के लिए",
            "Review Date": "2026-07-20",
        })
        # English -> kept
        writer.writerow({
            "Review ID": "en-1",
            "Rating": "5",
            "Title": "Helpful",
            "Review Text": "The application makes stock investing simple and straightforward for beginners",
            "Review Date": "2026-07-20",
        })

    reviews = load_file(csv_file, "app_store", settings)
    assert len(reviews) == 1
    assert reviews[0].id == "en-1"


def test_normalize_strips_emojis_from_text_and_title(tmp_path: Path, settings: Settings) -> None:
    csv_file = tmp_path / "emojis.csv"
    with csv_file.open("w", encoding="utf-8", newline="") as h:
        writer = csv.DictWriter(
            h,
            fieldnames=["Review ID", "Rating", "Title", "Review Text", "Review Date"],
        )
        writer.writeheader()
        writer.writerow({
            "Review ID": "emoji-1",
            "Rating": "5",
            "Title": "Super App \U0001f525\U0001f525",
            "Review Text": "I have been using this platform for mutual funds and stocks investment \U0001f44d\U0001f680",
            "Review Date": "2026-07-20",
        })

    reviews = load_file(csv_file, "app_store", settings)
    assert len(reviews) == 1
    assert reviews[0].title == "Super App"
    assert reviews[0].text == "I have been using this platform for mutual funds and stocks investment"


def test_save_to_csv(tmp_path: Path, settings: Settings) -> None:
    from ingestion.fetcher import APP_STORE_CSV_HEADERS, PLAY_STORE_CSV_HEADERS, save_to_csv

    app_file = tmp_path / "app_store_reviews.csv"
    play_file = tmp_path / "play_store_reviews.csv"

    app_rows = [
        {
            "Review ID": "app-1",
            "Rating": "5",
            "Title": "Great",
            "Review Text": "Smooth UI and fast KYC verification for new users",
            "Review Date": "2026-07-20T10:00:00Z",
            "Reviewer Name": "Tester",
        }
    ]
    play_rows = [
        {
            "Review ID": "play-1",
            "Star Rating": "4",
            "Review": "Good app for mutual funds investment and stock trading",
            "Review Submit Date and Time": "2026-07-21 12:00:00",
            "Reviewer Name": "Tester2",
        }
    ]

    save_to_csv(app_rows, APP_STORE_CSV_HEADERS, app_file)
    save_to_csv(play_rows, PLAY_STORE_CSV_HEADERS, play_file)

    app_reviews = load_file(app_file, "app_store", settings)
    play_reviews = load_file(play_file, "play_store", settings)

    assert len(app_reviews) == 1
    assert app_reviews[0].id == "app-1"
    assert app_reviews[0].rating == 5
    assert app_reviews[0].text == "Smooth UI and fast KYC verification for new users"

    assert len(play_reviews) == 1
    assert play_reviews[0].id == "play-1"
    assert play_reviews[0].rating == 4
    assert play_reviews[0].text == "Good app for mutual funds investment and stock trading"
