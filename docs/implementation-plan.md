# Implementation Plan � Weekly Pulse Review Agent

> **Project:** Groww App � Weekly Pulse Review
> **Last Updated:** 2026-07-27
> **Approach:** Phase-wise, each phase independently testable with clear entry conditions and exit criteria

---

## ?? Phased Overview

```
Phase 1          Phase 2           Phase 3            Phase 4
---------        ----------        -------------       ----------------
Data             AI Pipeline       Pulse Assembly      MCP Delivery
Ingestion    ?   (Clustering   ?   & Validation    ?   (Google Docs
& Parsing        + Summarizing)                         + Gmail)
```

| Phase | Name | Goal | Exit Criteria |
|-------|------|------|---------------|
| **1** | Data Ingestion | Load, normalize, and sanitize reviews | Clean `Review[]` list, PII-free, date-filtered |
| **2** | AI Pipeline | Cluster themes, rank, select quotes & actions | Structured `Pulse` object with all required fields |
| **3** | Pulse Assembly | Validate pulse constraints, build final doc | =250 words, 3 themes, 3 quotes, 3 actions confirmed |
| **4** | MCP Delivery | Publish to Google Docs and create Gmail draft | Doc URL returned, Gmail draft visible in inbox |

**Sequencing rule:** Each phase must fully pass its exit criteria before the next phase begins. No phase is started speculatively.

---

## Phase 1 � Data Ingestion & Parsing

### Goal
Ingest raw App Store and Play Store review exports, normalize them to a shared schema, filter to the last 8�12 weeks, and strip all PII before any downstream processing. At the end of this phase we have a trusted, clean list of `Review` objects ready for the AI pipeline.

### Why This Phase Exists First
All downstream components � LLM calls, quote selection, output artifacts � depend on clean, PII-free data. Running ingestion as a standalone phase ensures we never accidentally send raw reviewer data to an LLM or publish it in a document. Catching data quality issues here (too few reviews, malformed dates) prevents wasted LLM API calls in Phase 2.

### Entry Conditions
- Raw CSV / JSON export files from App Store and/or Play Store are available locally under `data/raw/`
- `settings.yaml` is configured with `lookback_weeks` and `sources`

### What Happens in This Phase

**Step 1 � Load raw exports**
Read CSV or JSON files from both stores. Each store uses different column names (e.g., App Store uses `"Review Text"`, Play Store uses `"Review"`). The loader maps store-specific columns to the unified internal schema without hard-coding field names in business logic � mappings live in config.

**Step 2 � Normalize to `Review` schema**
Each record is converted to a `Review` dataclass with fields: `id`, `source`, `rating`, `title`, `text`, `date`, `pii_stripped`. Missing optional fields (e.g., `title` on Play Store) are set to `None` rather than causing a crash.

**Step 3 � Date filter**
Only reviews within the configured `lookback_weeks` window are retained. The filter uses the review's `date` field parsed as a `datetime` object. Reviews with unparseable dates are skipped with a logged warning (row index and raw date value included in the log). The pipeline requires at least 30 reviews after filtering; if fewer, it halts with `InsufficientDataError`.

**Step 4 � PII stripping**
Two-pass cleaning:
1. **Field drop:** `reviewer_name`, `user_id`, `display_name`, `reviewer_id` columns are removed entirely from the `Review` object � they never enter the dataclass.
2. **Regex redaction in text:** Email addresses, personally identifying URLs, and device identifiers found inside the `text` field are replaced with `[REDACTED]` or `[LINK]`. After passing both passes, `pii_stripped` is set to `True`.

**Step 5 � Output**
A `List[Review]` is returned. All records have `pii_stripped=True`. This list is the sole input to Phase 2.

### Inputs
| Input | Format | Source |
|-------|--------|--------|
| App Store export | `.csv` | iTunes Connect / public export |
| Play Store export | `.csv` / `.json` | Google Play Console / public |

### Outputs
```
List[Review]  � normalized, date-filtered, PII-stripped
Minimum count: 30 reviews
All records: pii_stripped = True
```

### Configuration Used (`settings.yaml`)
```yaml
ingestion:
  lookback_weeks: 10
  sources:
    - app_store
    - play_store
  min_reviews_required: 30
```

### Exit Criteria
- All unit tests pass with zero failures
- Data quality checks pass on real Groww export (all ratings 1�5, all dates valid, no PII fields present)
- No PII found in any processed `Review.text` field (regex scan clean)
- Review count after filtering: = 30
- No unhandled exceptions on malformed or missing input files

---

## Phase 2 � AI Pipeline (Clustering, Ranking & Generation)

### Goal
Use an LLM to assign each review to a theme, rank themes by prevalence, select the best representative quote per top theme, and generate three concrete action ideas. At the end of this phase we have a fully populated `Pulse` struct.

### Why This Phase Exists Separately
The AI pipeline involves external API calls (LLM), non-deterministic output, and the highest risk of quality failure. Isolating it as a distinct phase makes it possible to test and evaluate LLM quality independently, mock LLM responses in unit tests, and adjust prompts without touching ingestion or delivery code.

### Entry Conditions
- Phase 1 has completed successfully and produced a `List[Review]` with = 30 records, all `pii_stripped=True`
- `settings.yaml` has `themes.allowed` and `llm` sections configured
- Google GenAI SDK is installed and the API key is available via environment variable

### What Happens in This Phase

**Step 1 � Theme clustering**
Reviews are sent to the LLM in batches of 20 (configurable). For each batch, a single LLM call assigns a theme to every review in the batch. The prompt provides the closed list of allowed themes and instructs the model to respond with only the theme name. This produces a `Map[theme ? List[Review]]`.

Reviews that the LLM assigns to `"other"` are collected separately. If the total `"other"` count exceeds any named theme's count, a warning is logged recommending theme taxonomy review � but the pipeline continues.

**Step 2 � Theme ranking**
Themes are ranked by a weighted review count. The default weighting scheme gives higher weight to 1�2 star reviews (severity-weighted), because low-star reviews typically represent the most critical user pain points. The top 3 themes by weighted count are selected. In the event of a tie, alphabetical ordering is used as a deterministic tie-breaker.

**Step 3 � Quote selection**
For each of the top-3 themes, one representative quote is selected from that theme's reviews. Selection preference: quotes that are specific (mention a product feature, named flow, or concrete outcome) over generic complaints ("the app is bad"). A secondary regex PII scan runs on each candidate quote as a safety net before it is accepted. The selected quote is verbatim � no paraphrasing or LLM rewriting.

**Step 4 � Action idea generation**
A single LLM call receives the top-3 theme names plus their selected quotes as grounding context. The model is instructed to generate exactly 3 numbered, specific, actionable improvement ideas � each referencing its theme and staying within 2 sentences. Generic advice is explicitly ruled out in the prompt.

**Step 5 � Output**
A `Pulse` struct is returned containing exactly 3 `Theme` objects, 3 quotes, 3 action ideas, total review count, and the week start date.


### Model Quotas & Rate-Limiting Strategy
To operate safely within the API tier limits:
- **Requests per minute (RPM)**: 30
- **Requests per day (RPD)**: 1,000
- **Tokens per minute (TPM)**: 12,000
- **Tokens per day (TPD)**: 100,000

| Pipeline Parameter | Value | Quota Justification |
|---|---|---|
| **Max Reviews Processed** | 1,000 | Limits total token consumption to ~30,000 tokens (30% of 100K daily limit). |
| **Batch Size** | 25 reviews | Yields exactly 40 clustering requests + 2 summary/action requests = 42 total calls (4.2% of daily limit). |
| **Inter-Batch Delay** | 2.5 seconds | Caps throughput to ~12–15 RPM and ~8,400 TPM (safely under 30 RPM and 12K TPM). |
| **Backoff on 429** | 15–30s sleep | Automatically handles transient rate limit responses with exponential retry. |


### LLM Settings
| Setting | Value | Reason |
|---------|-------|--------|
| Model | `gemini-3.6-flash` | Fast, cost-effective, sufficient quality |
| Temperature | `0.3` | Low for classification consistency |
| Max output tokens | `512` per call | Covers theme name + brief generation |
| Batch size | 20 reviews | Balances context window and API calls |
| Retries | 3� exponential backoff | Handles transient rate limits |

### Outputs
```
Pulse {
  top_themes: List[Theme]       # exactly 3
  quotes: List[str]             # exactly 3, verbatim, PII-clean
  action_ideas: List[str]       # exactly 3
  review_count: int             # total reviews processed
  week_of: date
}
```

### Exit Criteria
- All unit tests pass (LLM calls mocked for determinism)
- LLM quality evaluation: = 4 of 5 manual quality criteria rated "pass" on real Groww data
- `Pulse` object contains exactly 3 themes, 3 quotes, 3 action ideas
- All quotes are non-empty and PII-free
- No LLM call throws an unhandled exception on valid input
- LLM cost per run documented (token counts logged)

---

## Phase 3 � Pulse Assembly & Validation

### Goal
Assemble the `Pulse` struct into a formatted weekly document and enforce all hard constraints before any delivery attempt. This phase acts as a quality gate � nothing proceeds to MCP delivery unless the pulse is fully valid.

### Why This Phase Exists Separately
Validation is separated from generation so that constraint failures can be caught cleanly and reported clearly, without partially writing a document or sending a malformed draft. It also makes the template and validation rules independently testable without requiring LLM calls.

### Entry Conditions
- Phase 2 has completed successfully and produced a `Pulse` struct
- `settings.yaml` has `pulse.max_words` and required counts configured

### What Happens in This Phase

**Step 1 � Template rendering**
The `Pulse` struct fields are inserted into a fixed Markdown template. The template has named placeholder slots for each section (themes, quotes, actions). After rendering, a guard check confirms no `{placeholder}` literal strings remain in the output � catching any template fields that were not filled.

**Step 2 � Word count check**
The rendered Markdown text is split on whitespace. The count must be = 250. If it exceeds the limit, the pipeline halts immediately. This is a hard stop � not a truncation. The LLM prompts in Phase 2 are designed to produce concise output; if they fail, the prompt engineering needs adjustment, not the word limit.

**Step 3 � Structural validation**
Confirms exactly 3 themes, 3 quotes, and 3 action ideas are present in the `Pulse` struct. Any deviation (even 2 or 4) is a validation failure.

**Step 4 � PII re-scan on quotes**
Each of the 3 selected quotes is run through the same PII regex patterns used in ingestion. This is a secondary safety net for cases where PII somehow survived Phase 1 (e.g., hidden in unusual formatting). If any quote contains a PII pattern, validation fails and the offending quote is identified in the error output.

**Step 5 � Output**
A `RenderedPulse` struct is returned with `validated=True` and an empty `validation_errors` list. If any check fails, `validated=False` and the `validation_errors` list describes each failure. The pipeline halts before reaching Phase 4.

### Outputs
```
RenderedPulse {
  markdown_text: str            # formatted, ready-to-publish Markdown
  word_count: int               # confirmed = 250
  validated: bool               # True only if all checks pass
  validation_errors: list[str]  # empty if validated=True
}
```

### Exit Criteria
- All unit tests pass (word count boundary, PII detection, template rendering, structural checks)
- Rendered pulse word count confirmed = 250 on real data
- Pulse passes all validation checks (`validated = True`)
- Manual readability review: pulse feels professional, scannable, and attribution-free
- Template renders correctly with sample data (no `{placeholder}` visible in output)

---

## Phase 4 � MCP Delivery (Google Docs + Gmail)

### Goal
Deliver the validated pulse to Google Docs (create or update document) and Gmail (create a draft email) using MCP servers exclusively. No direct Google REST API calls. This is the final phase � its success means the weekly pulse is published and ready to share.

### Why This Phase Exists Last
Delivery depends on a fully valid pulse. Running it last ensures that MCP tool calls are only made when we have high confidence in the content. It also isolates external service dependencies (MCP availability, network, OAuth state) from the purely local Phases 1�3.

### Entry Conditions
- Phase 3 has produced a `RenderedPulse` with `validated=True`
- Google Docs MCP server is running and reachable
- Gmail MCP server is running and reachable
- `settings.yaml` has `delivery.recipient_email` and title/subject format strings configured

### What Happens in This Phase

**Step 1 � Google Docs: idempotent publish**
The `docs_client` constructs the document title for the current week using the configured format string (e.g., `"Weekly Pulse � Groww App | 2026-W30"`). It checks whether a document with that title already exists. If yes, it calls `update_document` with the new content (idempotent re-run). If no, it calls `create_document`. Either path returns a Google Doc URL.

**Step 2 � Gmail: draft creation**
The `gmail_client` receives the `RenderedPulse` and the `doc_url` from Step 1. It calls the `create_draft` MCP tool with:
- `to`: the configured recipient email address
- `subject`: formatted using `draft_subject_format` from config (e.g., `"Weekly Pulse � Groww App | Week of 2026-07-21"`)
- `body`: the pulse Markdown text plus a separator and the full Google Doc URL

The draft is created in Gmail Drafts � not sent automatically. A human reviews and sends it.

**Step 3 � Confirm outputs**
The pipeline logs the Google Doc URL and the Gmail draft ID. Both are printed to the terminal as the final output of `main.py`.

### MCP Tool Calls Reference

**Google Docs MCP:**
```json
{
  "tool": "create_document",
  "args": {
    "title": "Weekly Pulse � Groww App | 2026-W30",
    "content": "<markdown_text>"
  }
}
```

**Gmail MCP:**
```json
{
  "tool": "create_draft",
  "args": {
    "to": "you@example.com",
    "subject": "Weekly Pulse � Groww App | Week of 2026-07-21",
    "body": "<pulse_text>\n\nFull doc: <doc_url>"
  }
}
```

### Outputs
```
doc_url: str      # Google Doc URL (accessible link)
draft_id: str     # Gmail draft ID (visible in Drafts folder)
```

### Exit Criteria
- All integration tests pass (MCP connectivity, tool call responses, subject format, body content)
- End-to-end manual test: Google Doc created with correct title, content, and word count
- Gmail draft appears in Drafts with correct subject, recipient, and Doc URL in body
- No direct Google API calls detected in codebase (grep check for `googleapis.com`)
- Total pipeline runtime documented (target: < 2 minutes end-to-end)
- Re-running the pipeline in the same week calls `update_document` (not `create_document`)

---

## ?? Estimated Timeline

| Phase | Effort | Dependency |
|-------|--------|------------|
| Phase 1 � Ingestion | 1�2 days | None |
| Phase 2 � AI Pipeline | 2�3 days | Phase 1 complete |
| Phase 3 � Assembly | 1 day | Phase 2 complete |
| Phase 4 � MCP Delivery | 1�2 days | Phase 3 complete + MCP servers configured |
| **Total** | **5�8 days** | Sequential |

---

## ?? Tech Stack

| Component | Technology | Reason |
|-----------|------------|--------|
| Language | Python 3.11+ | Standard, well-supported, good dataclass/typing support |
| LLM | Gemini 2.0 Flash (via Google GenAI SDK) | Fast, cost-effective, native GCP integration |
| Google Docs integration | Google Docs MCP Server | No bespoke OAuth; clean tool interface |
| Gmail integration | Gmail MCP Server | Same rationale as Docs |
| Config management | `settings.yaml` + `pydantic` | Type-safe config loading with validation |
| Testing | `pytest` + `unittest.mock` | Standard Python test stack; mocking for LLM calls |
| Data format | CSV / JSON (raw), Dataclass (internal) | Simple, dependency-light ingestion |
