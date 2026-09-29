#!/usr/bin/env python3
"""CLI utility to download and store 8-12 weeks of public App Store and Play Store reviews."""

from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

# Add src to python path if run directly
src_dir = Path(__file__).resolve().parent.parent / "src"
if str(src_dir) not in sys.path:
    sys.path.insert(0, str(src_dir))

from ingestion.fetcher import (
    GROWW_APP_STORE_ID,
    GROWW_PLAY_STORE_PACKAGE,
    download_and_store_reviews,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("download_reviews")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Download 8-12 weeks of public App Store & Google Play Store reviews for Groww."
    )
    parser.add_argument(
        "--weeks",
        type=int,
        default=12,
        help="Number of weeks to look back (default: 12, recommended: 8-12)",
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="data/raw",
        help="Target directory to store CSV files (default: data/raw)",
    )
    parser.add_argument(
        "--play-package",
        type=str,
        default=GROWW_PLAY_STORE_PACKAGE,
        help=f"Google Play Store package name (default: {GROWW_PLAY_STORE_PACKAGE})",
    )
    parser.add_argument(
        "--app-id",
        type=str,
        default=GROWW_APP_STORE_ID,
        help=f"Apple App Store ID (default: {GROWW_APP_STORE_ID})",
    )
    parser.add_argument(
        "--max-play-reviews",
        type=int,
        default=10000,
        help="Maximum Play Store reviews to fetch (default: 10000)",
    )

    args = parser.parse_args()

    logger.info("Starting review download for the last %d weeks...", args.weeks)
    try:
        counts = download_and_store_reviews(
            output_dir=args.output_dir,
            lookback_weeks=args.weeks,
            play_package=args.play_package,
            app_store_id=args.app_id,
            max_play_reviews=args.max_play_reviews,
        )
        logger.info(
            "Download completed successfully! App Store: %d reviews, Play Store: %d reviews",
            counts["app_store"],
            counts["play_store"],
        )
        return 0
    except Exception as exc:
        logger.error("Download failed: %s", exc, exc_info=True)
        return 1


if __name__ == "__main__":
    sys.exit(main())
