"""Action idea generation via LLM."""
from __future__ import annotations

import logging
import re

from config import load_settings
from pipeline.models import Pulse
from pipeline.llm_client import generate_with_retry

logger = logging.getLogger(__name__)


def generate_actions(pulse: Pulse) -> list[str]:
    settings = load_settings()
    lines = []
    for idx, (theme, quote) in enumerate(zip(pulse.top_themes, pulse.quotes), 1):
        summary_str = f" - {theme.summary}" if theme.summary else ""
        lines.append(f"{idx}. Theme: {theme.name}{summary_str}\n   Quote: \"{quote}\"")

    prompt = (
        "You are a product improvement assistant for a fintech app.\n"
        "Given the top 3 user pain points below, generate exactly 3 numbered, specific, actionable improvement ideas.\n"
        "Each idea must reference its theme and be exactly 1 concise sentence (at most 20 words).\n"
        "Do NOT give generic advice like 'improve the app' or 'fix bugs'.\n\n"
        + "\n\n".join(lines)
        + "\n\nFormat:\n1. <action idea>\n2. <action idea>\n3. <action idea>"
    )

    raw = generate_with_retry(prompt, temperature=settings.llm.temperature, max_output_tokens=settings.llm.max_output_tokens)
    actions = [
        line.strip()
        for line in raw.strip().splitlines()
        if line.strip() and re.match(r"^\d+[\.\)]\s+", line.strip())
    ]

    if len(actions) < 3:
        logger.warning("LLM returned %d actions, expected 3. Using raw lines.", len(actions))
        actions = [line.strip() for line in raw.strip().splitlines() if line.strip()][:3]
        while len(actions) < 3:
            actions.append("")

    return actions[:3]
