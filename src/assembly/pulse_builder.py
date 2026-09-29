"""Template rendering for the weekly pulse document."""
from __future__ import annotations

from pipeline.models import Pulse

TEMPLATE = (
    "# Weekly Pulse - Groww App\n"
    "Week of: {week_of}   |   Reviews analysed: {review_count}\n"
    "\n"
    "## Top Themes This Week\n"
    "1. {theme_1} - {theme_1_summary}\n"
    "2. {theme_2} - {theme_2_summary}\n"
    "3. {theme_3} - {theme_3_summary}\n"
    "\n"
    "## What Users Are Saying\n"
    '> "{quote_1}"\n'
    '> "{quote_2}"\n'
    '> "{quote_3}"\n'
    "\n"
    "## Recommended Actions\n"
    "1. {action_1}\n"
    "2. {action_2}\n"
    "3. {action_3}\n"
)


def render_pulse(pulse: Pulse) -> str:
    mapping = {
        "week_of": pulse.week_of.isoformat(),
        "review_count": str(pulse.review_count),
        "theme_1": pulse.top_themes[0].name if len(pulse.top_themes) > 0 else "",
        "theme_1_summary": pulse.top_themes[0].summary if len(pulse.top_themes) > 0 else "",
        "theme_2": pulse.top_themes[1].name if len(pulse.top_themes) > 1 else "",
        "theme_2_summary": pulse.top_themes[1].summary if len(pulse.top_themes) > 1 else "",
        "theme_3": pulse.top_themes[2].name if len(pulse.top_themes) > 2 else "",
        "theme_3_summary": pulse.top_themes[2].summary if len(pulse.top_themes) > 2 else "",
        "quote_1": pulse.quotes[0] if len(pulse.quotes) > 0 else "",
        "quote_2": pulse.quotes[1] if len(pulse.quotes) > 1 else "",
        "quote_3": pulse.quotes[2] if len(pulse.quotes) > 2 else "",
        "action_1": pulse.action_ideas[0] if len(pulse.action_ideas) > 0 else "",
        "action_2": pulse.action_ideas[1] if len(pulse.action_ideas) > 1 else "",
        "action_3": pulse.action_ideas[2] if len(pulse.action_ideas) > 2 else "",
    }

    rendered = TEMPLATE.format(**mapping)

    if "{" in rendered and "}" in rendered:
        raise ValueError("Template rendering failed: unfilled placeholders remain")

    return rendered


def count_words(text: str) -> int:
    return len(text.split())
