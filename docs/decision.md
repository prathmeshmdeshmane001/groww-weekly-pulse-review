# Decision Log — Weekly Pulse Review Agent

> **Project:** Groww App — Weekly Pulse Review
> **Last Updated:** 2026-07-27
> **Purpose:** Record key technical and architectural decisions with rationale and alternatives considered. Helps future contributors understand *why* choices were made, not just *what* was chosen.

---

## Decision Record Format

Each decision follows this structure:
- **Status:** Proposed / Accepted / Superseded / Deprecated
- **Context:** The situation that required a decision
- **Decision:** What was decided
- **Rationale:** Why this option was chosen
- **Alternatives Considered:** Other options evaluated
- **Consequences:** Trade-offs and implications

---

## D-001 — Use MCP Servers for Google Docs and Gmail (not direct REST APIs)

| Field | Value |
|-------|-------|
| **Status** | ? Accepted |
| **Date** | 2026-07-25 |
| **Decider** | Architecture team |

### Context
The system needs to create a Google Doc and a Gmail draft as deliverables. Two integration paths existed: call Google REST APIs directly (requiring OAuth 2.0 setup and credential management), or use MCP (Model Context Protocol) servers that expose named tools for these operations.

### Decision
Use **MCP servers exclusively** for all Google Docs and Gmail interactions. No direct Google REST API calls anywhere in application code.

### Rationale
- MCP servers handle OAuth, token refresh, and HTTP plumbing entirely — removing a significant maintenance burden from the application layer
- Application code only calls clean named tools (`create_document`, `create_draft`) — much simpler to reason about, test, and audit
- Portable: swapping the underlying MCP server implementation does not change any application code
- Consistent with the broader agent ecosystem where MCP is the standard integration boundary

### Alternatives Considered
| Alternative | Why Rejected |
|-------------|-------------|
| Direct Google REST API (`requests` + OAuth 2.0) | Requires bespoke OAuth flow, token storage, refresh logic — high complexity for zero added value |
| Google Python client libraries | Still requires OAuth setup and credential management; more code than MCP with no benefit |
| Third-party wrappers (e.g., `gspread`) | Only covers Sheets, not Docs; adds another dependency with partial coverage |

### Consequences
- ? Simpler application code — no auth logic anywhere in `src/`
- ? Auth and credential rotation handled entirely by MCP server
- ?? Dependency on MCP server availability and tool API stability
- ?? Debugging MCP tool call failures is less transparent than direct HTTP inspection

---

## D-002 — Use LLM for Theme Clustering (not keyword/regex matching)

| Field | Value |
|-------|-------|
| **Status** | ? Accepted |
| **Date** | 2026-07-25 |
| **Decider** | Architecture team |

### Context
Reviews needed to be grouped into =5 themes. The two main options were rule-based matching (keywords / regex dictionaries) or LLM-based semantic classification. The choice fundamentally affects the quality of clustering, maintainability, and adaptability of the system.

### Decision
Use **LLM-driven semantic clustering** for theme assignment. Each review is sent to the LLM with a closed list of theme names; the model returns exactly one theme name.

### Rationale
- App reviews use varied, informal, colloquial language — keyword matching misses paraphrasing (e.g., "money didn't come back" for a `withdrawals` issue, or "stuck at the selfie step" for a `KYC` issue)
- LLMs understand intent and context, not just surface tokens
- A single prompt handles all edge cases (sarcasm, shorthand, mixed-language) without maintaining a keyword dictionary
- Easy to adapt to new themes: just add a theme name to the config — no keyword list to curate or test

### Alternatives Considered
| Alternative | Why Rejected |
|-------------|-------------|
| Keyword / regex matching | High maintenance; misses synonyms, paraphrasing, and informal language; brittle as review language evolves |
| Traditional ML clustering (K-means, LDA) | Requires labelled training data, tokenization pipeline, and model hosting; overkill for =5 predefined, stable themes |
| Zero-shot classifier (Hugging Face) | Adds model hosting or download complexity; LLM via API is already available and simpler |

### Consequences
- ? Handles informal, varied, and multi-lingual review text naturally
- ? Adding or renaming a theme requires only a config change and prompt update
- ?? LLM API cost per run (must be budgeted and monitored per batch)
- ?? Non-deterministic — same review may occasionally get different themes on retry (mitigated with temperature `0.3`)

---

## D-003 — Maximum 5 Themes, Pulse Surfaces Top 3

| Field | Value |
|-------|-------|
| **Status** | ? Accepted |
| **Date** | 2026-07-25 |
| **Decider** | Architecture team |

### Context
Two related decisions needed to be made: how many themes to cluster into, and how many to surface in the weekly pulse. Too few themes loses signal; too many makes the pulse unwieldy and hard to act on.

### Decision
- Cluster into **at most 5 predefined themes**
- Surface only the **top 3 themes** in the pulse document

### Rationale
- 5 themes covers the core pain-point categories of a fintech app (onboarding, KYC, payments, statements, withdrawals) without over-fragmenting the review corpus
- 3 highlights keeps the pulse scannable and fits the "one-page" format
- Product and leadership teams typically act on 3 priorities at a time — surfacing more creates decision paralysis rather than focus
- The 5?3 funnel ensures the pulse reflects what users complain about *most this week*, not a comprehensive audit

### Alternatives Considered
| Alternative | Why Rejected |
|-------------|-------------|
| Unlimited themes (open clustering) | LLM free-form clustering produces inconsistent theme names week-to-week; not comparable across runs |
| Exactly 3 themes (no "top N" step) | Would miss the signal that comes from seeing all 5 in play; ranking by volume is important |
| Surface all 5 themes | Pulse exceeds 250-word limit easily; too much content for a "quick scan" artifact |

### Consequences
- ? Focused, actionable pulse that fits in one screen
- ? Consistent theme taxonomy week-over-week enables trend detection
- ?? Reviews that don't fit any of the 5 themes are assigned to `"other"` — must monitor `other` volume; if it dominates, the theme taxonomy needs revision
- ?? Themes 4 and 5 exist in the system but are invisible to stakeholders — this is intentional but should be documented

---

## D-004 — Strict PII Stripping at Ingestion (Privacy-by-Design)

| Field | Value |
|-------|-------|
| **Status** | ? Accepted |
| **Date** | 2026-07-25 |
| **Decider** | Architecture team |

### Context
App store reviews can contain reviewer names, email addresses, device identifiers, and occasionally self-identifying information in the review body. This data must never appear in output artifacts (the Google Doc or Gmail draft) and must never be sent to an external LLM API.

### Decision
Strip all PII from review data **at ingestion time**, in the earliest possible step, before any data reaches the AI pipeline or storage. A secondary PII regex scan is also run on selected quotes during Phase 3 as a safety net.

### Rationale
- **Privacy-by-design** principle: sanitize at the source, not at the point of use — downstream components never need to worry about PII
- Prevents PII from ever being included in LLM API request payloads
- Ensures output artifacts (Google Doc, Gmail draft) are clean by construction, not by luck
- Simplifies every downstream component — they can assume all `Review.text` values are safe

### PII Fields Handled
| Field / Pattern | Action |
|-----------------|--------|
| `reviewer_name` / `display_name` column | Dropped from `Review` object entirely — never stored |
| Email addresses in review `text` | Replaced with `[REDACTED]` |
| Personally identifying URLs | Replaced with `[LINK]` |
| Device model strings | Removed |
| `user_id` / `reviewer_id` fields | Dropped from `Review` object |

### Why Two Passes?
The primary PII stripping happens at ingestion. The secondary scan in Phase 3 (on the 3 selected quotes only) is a defence-in-depth measure — it catches edge cases where unusual formatting or encoding allowed a PII pattern to slip through the first pass.

### Consequences
- ? Clean data guarantee for all downstream components — no per-component PII checks needed
- ? LLM never receives any reviewer identity
- ? Output documents are safe to share broadly by construction
- ?? Some review context may be lost if the meaning depended on a personal detail (rare, acceptable edge case)

---

## D-005 — Hard Word Limit of =250 Words (Enforced, Not Soft)

| Field | Value |
|-------|-------|
| **Status** | ? Accepted |
| **Date** | 2026-07-25 |
| **Decider** | Architecture team |

### Context
The pulse is meant to be a quick scan for busy product and leadership stakeholders. The question was: how long should it be, and should the limit be advisory or enforced?

### Decision
Hard limit of **250 words** for the pulse note body. Validation **fails** if exceeded — the pipeline halts, the document is not published, and the prompt must be adjusted.

### Rationale
- Stakeholders skip long documents — the pulse only has value if it is read
- 250 words fits on a single screen without scrolling
- A hard stop (not a soft guideline) forces the AI to be concise from the start, rather than generating verbose output that gets silently truncated
- Truncating at the delivery layer would produce incomplete, mid-sentence output — far worse than a pipeline halt

### Why Not Auto-Truncate?
Auto-truncation at 250 words risks cutting a sentence or section mid-way, producing incoherent output. It also hides a prompt quality problem. A hard validation failure is more honest and forces a proper fix upstream.

### Consequences
- ? Pulse stays scannable — stakeholders reliably get the same concise format each week
- ? Forces prompt discipline during Phase 2 — action ideas and summaries must be tight
- ?? If the LLM generates verbose output, the pipeline halts and requires prompt tuning before it can proceed
- ?? Action ideas must each be =2 sentences; this is enforced in the generation prompt

---

## D-006 — Gemini 2.0 Flash as Default LLM

| Field | Value |
|-------|-------|
| **Status** | ? Accepted |
| **Date** | 2026-07-25 |
| **Decider** | Architecture team |

### Context
Which LLM to use for theme clustering (many calls, short outputs) and action idea generation (one call, short output)? The choice affects cost per run, inference speed, and output quality for these specific tasks.

### Decision
Use **Gemini 2.0 Flash** as the default model, with the model name configurable via `settings.yaml`.

### Rationale
- Fast inference — suitable for a pipeline that makes many batched clustering calls (50–200 reviews ? ~5–10 API calls)
- Cost-effective for the volume: clustering and short-form generation don't require a high-reasoning model
- Native integration with Google GenAI SDK (consistent with the GCP/MCP tooling stack)
- Configurable — swapping to a more powerful model requires only changing one line in `settings.yaml`

### Alternatives Considered
| Alternative | Why Not Default |
|-------------|----------------|
| Gemini Pro / Ultra | Higher cost per token; quality improvement is marginal for theme classification and 2-sentence generation |
| GPT-4o | Requires a separate API key and billing account; inconsistent with the Google ecosystem this project lives in |
| Claude (Anthropic) | Same cross-vendor issue; adds credential complexity |
| Local model via Ollama | Setup complexity; inference quality lower for nuanced classification; not production-ready for this use case |

### Consequences
- ? Fast pipeline execution (target: < 2 minutes end-to-end)
- ? Low cost per weekly run
- ? Model is swappable without any code change
- ?? Output quality depends on Gemini service availability and rate limits
- ?? If higher-quality output is needed for action generation, the action step can be independently upgraded to a different model via config

---

## D-007 — Public Review Exports Only (No Scraping)

| Field | Value |
|-------|-------|
| **Status** | ? Accepted |
| **Date** | 2026-07-25 |
| **Decider** | Architecture team |

### Context
Review data can be sourced via official developer console exports (iTunes Connect, Google Play Console) or via web scraping. Scraping offers more automation but creates legal and ToS risks.

### Decision
Use **official public review exports only**. No login-gated scraping, no automation that violates store Terms of Service.

### Rationale
- App Store and Play Store ToS prohibit scraping behind authentication
- Official exports provide all required fields (`rating`, `title`, `text`, `date`) in stable, documented formats
- Data from official exports is more reliable (no HTML parsing fragility, no session management)
- Legal and compliant by default — no risk of account suspension or legal exposure

### Consequences
- ? ToS-compliant data sourcing
- ? Stable, well-formed data format
- ?? Export must be triggered manually or via official developer APIs — not fully automated via the pipeline itself
- ?? There may be a lag between review publication and export availability (typically 24–48 hours)

---

## D-008 — Linear, Sequential Pipeline Architecture (No Parallelism)

| Field | Value |
|-------|-------|
| **Status** | ? Accepted |
| **Date** | 2026-07-26 |
| **Decider** | Architecture team |

### Context
When designing the pipeline, a choice had to be made between a linear sequential architecture (Phase 1 ? 2 ? 3 ? 4) and a more parallelised or event-driven design. For example, Phase 2 could start clustering reviews while Phase 1 is still loading; or delivery could be triggered by an event rather than a function call.

### Decision
Use a **strictly linear, sequential pipeline**. Each phase completes fully before the next begins. No parallel execution, no async message passing between phases.

### Rationale
- Simplicity: a linear pipeline is far easier to reason about, debug, and test
- Exit criteria between phases become natural checkpoints — failures are caught in isolation
- The volume of data (50–200 reviews per week) does not justify the complexity of parallelism
- Any parallelism would require shared state management or a message queue, adding infrastructure with no throughput benefit at this scale
- Testing is much simpler: each phase can be tested in isolation with well-defined input/output contracts

### Alternatives Considered
| Alternative | Why Rejected |
|-------------|-------------|
| Async concurrent pipeline (e.g., `asyncio` with task groups) | Adds complexity with no throughput gain at this data volume; harder to test and debug |
| Event-driven architecture (e.g., pubsub between phases) | Significant infrastructure overhead; overkill for a weekly batch job |
| Streaming (process reviews as they load) | Breaks the clean phase separation; makes date filtering and batch LLM calls harder to manage |

### Consequences
- ? Simple to understand, trace, and debug
- ? Each phase's output is fully available before the next phase starts — no partial state
- ? Straightforward to add logging, timing, and progress output between phases
- ?? Total runtime is sum of all phases; if review volume scales 10×, this may need revisiting

---

## D-009 — Single `settings.yaml` as Source of Truth for All Configuration

| Field | Value |
|-------|-------|
| **Status** | ? Accepted |
| **Date** | 2026-07-26 |
| **Decider** | Architecture team |

### Context
The pipeline has multiple configurable parameters: themes, lookback window, LLM model, word limit, recipient email, batch sizes, and more. These could live in environment variables, hardcoded constants, multiple config files, or a single central config file.

### Decision
All runtime-tunable parameters live in a **single `config/settings.yaml` file**, loaded at startup and validated with `pydantic`. Secrets (API keys) come from environment variables exclusively — never from the config file.

### Rationale
- A single config file makes it easy to review all tuneable parameters at once
- `pydantic` validation at load time catches misconfiguration early (before any LLM calls or file reads)
- Changing a theme, the word limit, or the LLM model requires only a config edit — no code change, no redeployment
- Separating secrets (env vars) from config (yaml) follows the Twelve-Factor App principle and prevents accidental credential commits

### Alternatives Considered
| Alternative | Why Rejected |
|-------------|-------------|
| Hardcoded constants in Python modules | Not configurable without code changes; scatters tuneable values across files |
| Multiple config files per phase | More files to maintain; no single place to see the full configuration |
| Environment variables for all config | Fine for secrets; awkward for complex structures like theme lists |
| `.env` file for all config | Flat key-value format is poor for nested structures like theme arrays |

### Consequences
- ? All tuneable parameters visible and editable in one place
- ? Early validation catches config errors before any external calls are made
- ? No secrets in config files — safe to commit `settings.yaml` to version control
- ?? `pydantic` is an additional dependency (lightweight, but worth noting)

---

## D-010 — Validation as a Hard Gate (Not a Soft Warning)

| Field | Value |
|-------|-------|
| **Status** | ? Accepted |
| **Date** | 2026-07-26 |
| **Decider** | Architecture team |

### Context
Phase 3 validates the pulse against several constraints (word count = 250, exactly 3 of each element, no PII in quotes). A design choice existed between treating validation failures as hard stops (pipeline halts) or soft warnings (pipeline continues, failures are logged).

### Decision
Validation failures are **hard stops**. If any constraint is violated, the pipeline halts immediately. No partial delivery occurs — the Google Doc is not created and the Gmail draft is not sent.

### Rationale
- Publishing a malformed, over-long, or PII-containing pulse is worse than not publishing at all
- Soft warnings create silent quality degradation — stakeholders receive a bad pulse without any visible signal that something went wrong
- A hard stop forces the root cause (usually a prompt quality issue) to be fixed properly rather than papered over
- The validation error output identifies exactly which constraint failed and why, making fixes straightforward

### Alternatives Considered
| Alternative | Why Rejected |
|-------------|-------------|
| Soft warnings + continue | Allows bad output to reach stakeholders; hides quality problems |
| Auto-fix (e.g., truncate to 250 words) | Truncation mid-sentence produces incoherent output; hides the real problem |
| Validation as a separate optional step | Inconsistently applied; defeats the purpose of the quality gate |

### Consequences
- ? Stakeholders always receive a valid, clean pulse or nothing (no intermediate bad state)
- ? Failures are highly visible and actionable
- ?? Pipeline must be re-run after fixing the root cause (usually prompt tuning)
- ?? Requires good error messages so the operator knows exactly what to fix

---

## ?? Open Decisions (To Be Resolved)

| ID | Question | Options | Target Date |
|----|----------|---------|-------------|
| D-011 | Should the pipeline run on a schedule (cron) or be triggered manually? | Cron weekly / Manual CLI / GitHub Actions | TBD |
| D-012 | Should the Google Doc be created fresh each week or updated in place? | New doc per week / Single doc with weekly sections appended | TBD |
| D-013 | How to handle the `"other"` theme bucket if it exceeds named themes? | Log and ignore / Surface as a 4th theme / Halt and alert | TBD |
| D-014 | Should action ideas be priority-ranked by the LLM or presented unordered? | LLM-ranked by estimated impact / Ordered by theme rank / Unordered | TBD |
