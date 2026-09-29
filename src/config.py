"""Load and validate runtime configuration from settings.yaml."""

from __future__ import annotations

from pathlib import Path
from typing import Literal

import yaml
from pydantic import BaseModel, Field, field_validator


class ColumnMapping(BaseModel):
    id: str | None = None
    rating: str
    title: str | None = None
    text: str
    date: str
    drop_fields: list[str] = Field(default_factory=list)


class IngestionConfig(BaseModel):
    lookback_weeks: int = Field(ge=1, le=52)
    sources: list[Literal["app_store", "play_store"]]
    min_reviews_required: int = Field(ge=1)
    max_reviews_to_process: int = Field(default=1000, ge=1)
    raw_data_dir: str = "data/raw"
    column_mappings: dict[str, ColumnMapping]


class ThemesConfig(BaseModel):
    allowed: list[str]
    max_themes: int = 5
    top_n_to_surface: int = 3


class LLMConfig(BaseModel):
    model: str
    temperature: float = Field(ge=0.0, le=2.0)
    max_output_tokens: int = Field(ge=1)
    batch_size: int = Field(ge=1)
    request_delay_seconds: float = Field(default=2.5, ge=0.0)
    max_retries: int = Field(ge=0)


class PulseConfig(BaseModel):
    max_words: int = Field(ge=1)
    quotes_required: int = Field(ge=1)
    actions_required: int = Field(ge=1)


class DeliveryConfig(BaseModel):
    recipient_email: str
    doc_title_format: str
    draft_subject_format: str


class Settings(BaseModel):
    ingestion: IngestionConfig
    themes: ThemesConfig
    llm: LLMConfig
    pulse: PulseConfig
    delivery: DeliveryConfig

    @field_validator("ingestion")
    @classmethod
    def validate_source_mappings(
        cls, ingestion: IngestionConfig
    ) -> IngestionConfig:
        for source in ingestion.sources:
            if source not in ingestion.column_mappings:
                raise ValueError(
                    f"Missing column_mappings entry for source '{source}'"
                )
        return ingestion


def load_settings(config_path: Path | None = None) -> Settings:
    """Load settings from YAML and validate with pydantic."""
    if config_path is None:
        config_path = Path(__file__).resolve().parent.parent / "config" / "settings.yaml"

    with config_path.open(encoding="utf-8") as handle:
        raw = yaml.safe_load(handle)

    return Settings.model_validate(raw)
