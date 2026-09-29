"""LLM client with retry logic for Gemini using google-genai SDK."""

from __future__ import annotations

import logging
import os
import time
from typing import Any

from dotenv import load_dotenv
from google import genai
from google.genai import types

from config import load_settings

load_dotenv()
logger = logging.getLogger(__name__)


def _get_api_key() -> str:
    """Retrieve API key from environment, ignoring template placeholders."""
    for key_name in ("GEMINI_API_KEY", "GOOGLE_API_KEY", "GEMNINI_API_KEY"):
        val = os.environ.get(key_name, "").strip()
        if val and not val.startswith("your-") and val != "your-gemini-api-key-here":
            return val
    return ""


def _get_client() -> genai.Client:
    api_key = _get_api_key()
    if not api_key:
        raise EnvironmentError("Set GOOGLE_API_KEY or GEMINI_API_KEY in .env to use the LLM.")
    os.environ["GOOGLE_API_KEY"] = api_key
    os.environ["GEMINI_API_KEY"] = api_key
    return genai.Client(api_key=api_key)


def generate_with_retry(
    prompt: str,
    *,
    temperature: float | None = None,
    max_output_tokens: int | None = None,
    response_mime_type: str | None = None,
) -> str:
    settings = load_settings()
    client = _get_client()
    temperature = temperature if temperature is not None else settings.llm.temperature
    max_output_tokens = (
        max_output_tokens if max_output_tokens is not None else settings.llm.max_output_tokens
    )
    max_retries = settings.llm.max_retries

    config_args: dict[str, Any] = {
        "temperature": temperature,
        "max_output_tokens": max_output_tokens,
    }
    if response_mime_type:
        config_args["response_mime_type"] = response_mime_type

    config = types.GenerateContentConfig(**config_args)

    last_exc: Exception | None = None
    for attempt in range(max_retries + 1):
        try:
            response = client.models.generate_content(
                model=settings.llm.model,
                contents=prompt,
                config=config,
            )
            text = (response.text or "").strip()
            if not text:
                raise ValueError("LLM returned empty response")
            return text
        except Exception as exc:
            last_exc = exc
            err_str = str(exc).lower()
            is_rate_limit = "429" in err_str or "resource_exhausted" in err_str or "quota" in err_str
            if attempt < max_retries:
                wait = (15 if is_rate_limit else 2) ** (attempt + 1) if not is_rate_limit else 10 * (attempt + 1)
                logger.warning(
                    "LLM call failed (attempt %d/%d): %s. Retrying in %ds...",
                    attempt + 1,
                    max_retries,
                    exc,
                    wait,
                )
                time.sleep(wait)
            else:
                logger.error("LLM call failed after %d attempts: %s", max_retries + 1, exc)
                raise last_exc

    return ""
