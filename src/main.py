"""Weekly Pulse Review — pipeline orchestrator."""
from __future__ import annotations

import argparse
import logging
import sys

from config import load_settings
from exceptions import InsufficientDataError
from ingestion.review_loader import load_reviews
from pipeline.pipeline import run_ai_pipeline

logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


def run_phase_1() -> int:
    """Run Phase 1 ingestion and print a summary."""
    settings = load_settings()
    try:
        reviews = load_reviews(settings)
    except FileNotFoundError as exc:
        logger.error("%s", exc)
        return 1
    except InsufficientDataError as exc:
        logger.error("%s", exc)
        return 1

    sources = {review.source for review in reviews}
    logger.info(
        "Phase 1 complete: %d reviews loaded from %s",
        len(reviews),
        ", ".join(sorted(sources)),
    )
    logger.info("All reviews PII-stripped: %s", all(r.pii_stripped for r in reviews))
    return 0


def run_phase_2() -> int:
    """Run Phase 1 then Phase 2."""
    settings = load_settings()
    try:
        reviews = load_reviews(settings)
    except FileNotFoundError as exc:
        logger.error("%s", exc)
        return 1
    except InsufficientDataError as exc:
        logger.error("%s", exc)
        return 1

    sources = {review.source for review in reviews}
    logger.info(
        "Phase 1 complete: %d reviews loaded from %s",
        len(reviews),
        ", ".join(sorted(sources)),
    )
    logger.info("All reviews PII-stripped: %s", all(r.pii_stripped for r in reviews))

    try:
        pulse = run_ai_pipeline(reviews)
    except Exception as exc:
        logger.error("Phase 2 failed: %s", exc)
        return 1

    logger.info("Phase 2 complete: Pulse generated")
    logger.info("Themes: %s", ", ".join(t.name for t in pulse.top_themes))
    logger.info("Review count: %d", pulse.review_count)
    logger.info("Week of: %s", pulse.week_of)
    return 0


def run_phase_3() -> int:
    """Run Phase 1, 2, then 3."""
    settings = load_settings()
    try:
        reviews = load_reviews(settings)
    except FileNotFoundError as exc:
        logger.error("%s", exc)
        return 1
    except InsufficientDataError as exc:
        logger.error("%s", exc)
        return 1

    sources = {review.source for review in reviews}
    logger.info(
        "Phase 1 complete: %d reviews loaded from %s",
        len(reviews),
        ", ".join(sorted(sources)),
    )
    logger.info("All reviews PII-stripped: %s", all(r.pii_stripped for r in reviews))

    try:
        pulse = run_ai_pipeline(reviews)
    except Exception as exc:
        logger.error("Phase 2 failed: %s", exc)
        return 1

    logger.info("Phase 2 complete: Pulse generated")
    logger.info("Themes: %s", ", ".join(t.name for t in pulse.top_themes))
    logger.info("Review count: %d", pulse.review_count)
    logger.info("Week of: %s", pulse.week_of)

    try:
        from assembly.pulse_builder import render_pulse
        from assembly.validator import validate_pulse

        markdown_text = render_pulse(pulse)
        rendered = validate_pulse(pulse, markdown_text)
    except Exception as exc:
        logger.error("Phase 3 failed: %s", exc)
        return 1

    if not rendered.validated:
        for error in rendered.validation_errors:
            logger.error("Validation error: %s", error)
        return 1

    logger.info("Phase 3 complete: Pulse validated and rendered")
    logger.info("Word count: %d", rendered.word_count)
    logger.info("Markdown preview:\n%s", rendered.markdown_text[:500])
    return 0


def run_phase_4() -> int:
    """Run Phase 1, 2, 3, then 4."""
    settings = load_settings()
    try:
        reviews = load_reviews(settings)
    except FileNotFoundError as exc:
        logger.error("%s", exc)
        return 1
    except InsufficientDataError as exc:
        logger.error("%s", exc)
        return 1

    sources = {review.source for review in reviews}
    logger.info(
        "Phase 1 complete: %d reviews loaded from %s",
        len(reviews),
        ", ".join(sorted(sources)),
    )
    logger.info("All reviews PII-stripped: %s", all(r.pii_stripped for r in reviews))

    try:
        pulse = run_ai_pipeline(reviews)
    except Exception as exc:
        logger.error("Phase 2 failed: %s", exc)
        return 1

    logger.info("Phase 2 complete: Pulse generated")
    logger.info("Themes: %s", ", ".join(t.name for t in pulse.top_themes))
    logger.info("Review count: %d", pulse.review_count)
    logger.info("Week of: %s", pulse.week_of)

    try:
        from assembly.pulse_builder import render_pulse
        from assembly.validator import validate_pulse

        markdown_text = render_pulse(pulse)
        rendered = validate_pulse(pulse, markdown_text)
    except Exception as exc:
        logger.error("Phase 3 failed: %s", exc)
        return 1

    if not rendered.validated:
        for error in rendered.validation_errors:
            logger.error("Validation error: %s", error)
        return 1

    logger.info("Phase 3 complete: Pulse validated and rendered")
    logger.info("Word count: %d", rendered.word_count)

    try:
        from delivery.docs_client import create_or_update_document
        from delivery.gmail_client import create_draft

        doc_url = create_or_update_document(rendered)
        draft_id = create_draft(doc_url, rendered)
    except Exception as exc:
        logger.error("Phase 4 failed: %s", exc)
        return 1

    logger.info("Phase 4 complete: Delivered")
    logger.info("Google Doc URL: %s", doc_url)
    logger.info("Gmail Draft ID: %s", draft_id)
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Weekly Pulse Review pipeline")
    parser.add_argument(
        "--phase",
        type=int,
        choices=[1, 2, 3, 4],
        default=1,
        help="Pipeline phase to run (default: 1)",
    )
    parser.add_argument(
        "--download",
        action="store_true",
        help="Download latest 8-12 weeks of reviews before running pipeline phase",
    )
    parser.add_argument(
        "--weeks",
        type=int,
        default=None,
        help="Number of weeks to look back when downloading (default from settings: 10/12)",
    )
    args = parser.parse_args()

    if args.download:
        from ingestion.fetcher import download_and_store_reviews
        settings = load_settings()
        weeks = args.weeks or settings.ingestion.lookback_weeks
        logger.info("Downloading reviews for the last %d weeks...", weeks)
        download_and_store_reviews(
            output_dir=settings.ingestion.raw_data_dir,
            lookback_weeks=weeks,
        )

    if args.phase == 1:
        return run_phase_1()
    if args.phase == 2:
        return run_phase_2()
    if args.phase == 3:
        return run_phase_3()
    if args.phase == 4:
        return run_phase_4()

    logger.error("Phase %d is not implemented yet.", args.phase)
    return 1


if __name__ == "__main__":
    sys.exit(main())

