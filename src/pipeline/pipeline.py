"""Phase 2 orchestrator."""
from __future__ import annotations

import logging
from datetime import date, timedelta, timezone

from config import load_settings
from exceptions import InsufficientDataError
from ingestion.models import Review
from pipeline.action_generator import generate_actions
from pipeline.models import Pulse, Theme
from pipeline.quote_selector import select_quotes
from pipeline.theme_engine import cluster_reviews, generate_summaries, rank_themes

logger = logging.getLogger(__name__)


def _week_of_date(reviews: list[Review]) -> date:
    if not reviews:
        return date.today()
    most_recent = max(r.date for r in reviews)
    monday = most_recent.date() - timedelta(days=most_recent.weekday())
    return monday


def run_ai_pipeline(reviews: list[Review]) -> Pulse:
    if len(reviews) < 30:
        raise InsufficientDataError(len(reviews), 30)

    settings = load_settings()

    themes_map = cluster_reviews(reviews, batch_size=settings.llm.batch_size)
    top_themes = rank_themes(themes_map)
    top_themes = generate_summaries(top_themes, themes_map)
    quotes = select_quotes(top_themes, themes_map)

    action_ideas = generate_actions(
        Pulse(
            top_themes=top_themes,
            quotes=quotes,
            action_ideas=[],
            review_count=len(reviews),
            week_of=_week_of_date(reviews),
        )
    )

    return Pulse(
        top_themes=top_themes,
        quotes=quotes,
        action_ideas=action_ideas,
        review_count=len(reviews),
        week_of=_week_of_date(reviews),
    )
