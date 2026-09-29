# Evaluation Plan — Weekly Pulse Review Agent

> **Project:** Groww App — Weekly Pulse Review
> **Last Updated:** 2026-07-25
> **Purpose:** Define testing strategy, test cases, and exit criteria for each phase before proceeding to the next

---

## 📋 Evaluation Philosophy

Each phase must **pass all exit criteria** before the next phase begins. This ensures:
- Failures are caught early and in isolation
- Each component is trustworthy before being composed
- The final delivery is reliable end-to-end

**Testing levels used:**
| Level | When Used |
|-------|-----------|
| **Unit tests** | Every function in isolation |
| **Integration tests** | Components working together |
| **LLM eval** | Quality of AI-generated content |
| **End-to-end test** | Full pipeline with sample data |
| **Manual verification** | Google Doc created, Gmail draft visible |

---

## Phase 1 — Data Ingestion: Evaluation

### Test Cases

#### Unit Tests (`test_ingestion.py`)

| Test | Input | Expected Output | Status |
|------|-------|-----------------|--------|
| `test_parse_appstore_csv` | Valid App Store CSV | List of `Review` objects with correct fields | ☐ |
| `test_parse_playstore_csv` | Valid Play Store CSV | List of `Review` objects with correct fields | ☐ |
| `test_missing_title_field` | Review with no `title` column | `title = None`, no crash | ☐ |
| `test_date_filter_includes` | Review 8 weeks ago | Included in output | ☐ |
| `test_date_filter_excludes` | Review 14 weeks ago | Excluded from output | ☐ |
| `test_date_filter_boundary` | Review exactly 12 weeks ago | Included (boundary inclusive) | ☐ |
| `test_pii_email_redacted` | Review text contains `"email me at user@gmail.com"` | Email replaced with `[REDACTED]` | ☐ |
| `test_pii_username_stripped` | Review has `reviewer_name` field | Field absent in output | ☐ |
| `test_empty_export` | Empty CSV file | Returns empty list, no crash | ☐ |
| `test_malformed_date` | Review with unparseable date | Skipped with logged warning | ☐ |

#### Data Quality Checks (manual)

- [ ] At least **50 reviews** loaded after date filtering
- [ ] No `reviewer_name`, `user_id`, or `email` fields present in any `Review` object
- [ ] All `rating` values are integers in range `[1, 5]`
- [ ] All `date` values parse as valid `datetime` objects
- [ ] `source` field is either `"app_store"` or `"play_store"` for every record

### Exit Criteria — Phase 1 ✅

> **ALL must pass before proceeding to Phase 2**

- [ ] All unit tests pass (`pytest tests/test_ingestion.py` — 0 failures)
- [ ] Data quality checks pass on real Groww export
- [ ] No PII found in any processed `Review.text` field (regex scan clean)
- [ ] Review count after filtering: **≥ 30 reviews**
- [ ] No unhandled exceptions on malformed input

---

## Phase 2 — AI Pipeline: Evaluation

### Test Cases

#### Unit Tests — Theme Clustering (`test_pipeline.py`)

| Test | Input | Expected Output | Status |
|------|-------|-----------------|--------|
| `test_cluster_clear_payment_review` | `"My SIP payment failed twice"` | Theme: `payments` | ☐ |
| `test_cluster_kyc_review` | `"KYC verification keeps rejecting my PAN"` | Theme: `KYC` | ☐ |
| `test_cluster_ambiguous_review` | `"App is slow and crashes"` | Any valid theme or `"other"` | ☐ |
| `test_cluster_empty_text` | `""` | Returns `"other"`, no crash | ☐ |
| `test_ranking_top3` | 5 themes with counts `[30,25,20,10,5]` | Top 3: first three themes | ☐ |
| `test_ranking_tie` | Two themes tied at count 20 | Deterministic tie-breaking (alphabetical or rating) | ☐ |
| `test_quote_not_empty` | Any theme with reviews | Selected quote is non-empty string | ☐ |
| `test_quote_pii_free` | Reviews with emails in text | Selected quote contains no email pattern | ☐ |
| `test_action_count` | Top 3 themes provided | Exactly 3 action ideas returned | ☐ |
| `test_action_not_generic` | Themes: `KYC`, `payments`, `onboarding` | Each action references its theme explicitly | ☐ |

#### LLM Output Quality Evaluation (manual review)

Run the pipeline on real Groww reviews and evaluate LLM output:

| Criterion | Target | How to Check |
|-----------|--------|--------------|
| Theme assignment accuracy | ≥ 80% of manually spot-checked reviews correctly themed | Manually check 20 random reviews |
| Quote relevance | All 3 quotes clearly relate to their theme | Read each quote and its assigned theme |
| Action specificity | Actions name a real feature or flow (not "improve the app") | Read each action idea |
| Action groundedness | Each action is traceable to a theme/quote | Cross-check themes → actions |
| No hallucinated content | Actions don't invent features not in Groww | Spot check against Groww feature list |

### Exit Criteria — Phase 2 ✅

> **ALL must pass before proceeding to Phase 3**

- [ ] All unit tests pass (`pytest tests/test_pipeline.py` — 0 failures)
- [ ] LLM quality evaluation: ≥ 4 of 5 criteria rated "pass" on manual review
- [ ] `Pulse` object contains exactly: 3 themes, 3 quotes, 3 action ideas
- [ ] All quotes are non-empty and PII-free (regex scan)
- [ ] No LLM call throws an exception on valid input
- [ ] LLM cost per run is documented (tokens in/out logged)

---

## Phase 3 — Pulse Assembly: Evaluation

### Test Cases

#### Unit Tests (`test_pulse_builder.py`)

| Test | Input | Expected Output | Status |
|------|-------|-----------------|--------|
| `test_word_count_under_limit` | Pulse with 200 words | `word_count = 200`, `validated = True` | ☐ |
| `test_word_count_at_limit` | Pulse with exactly 250 words | `validated = True` | ☐ |
| `test_word_count_over_limit` | Pulse with 251 words | `validated = False`, error logged | ☐ |
| `test_template_all_fields` | Full `Pulse` object | Rendered markdown contains all 3 themes, 3 quotes, 3 actions | ☐ |
| `test_pii_scan_clean` | Quotes with no PII | `validation_errors = []` | ☐ |
| `test_pii_scan_detects_email` | Quote containing `"@gmail.com"` | Validation fails, error reported | ☐ |
| `test_missing_theme` | Pulse with 2 themes | Validation fails | ☐ |
| `test_missing_quote` | Pulse with 2 quotes | Validation fails | ☐ |
| `test_missing_action` | Pulse with 2 actions | Validation fails | ☐ |
| `test_empty_quote_rejected` | One quote is `""` | Validation fails | ☐ |

#### Manual Quality Review

- [ ] Read the rendered pulse — does it feel professional and scannable?
- [ ] Are themes named clearly (not `"theme_1"`)?
- [ ] Are quotes attributed anonymously (no names)?
- [ ] Are action ideas ordered by priority/impact?

### Exit Criteria — Phase 3 ✅

> **ALL must pass before proceeding to Phase 4**

- [ ] All unit tests pass (`pytest tests/test_pulse_builder.py` — 0 failures)
- [ ] Rendered pulse word count confirmed ≤ 250
- [ ] Pulse passes all validation checks (`validated = True`)
- [ ] Manual quality review: "Yes" to all 4 quality questions above
- [ ] Template renders correctly with sample data (no `{placeholder}` visible in output)

---

## Phase 4 — MCP Delivery: Evaluation

### Test Cases

#### Integration Tests (`test_delivery.py`)

| Test | What Is Tested | Expected Result | Status |
|------|----------------|-----------------|--------|
| `test_docs_mcp_connection` | MCP server reachable | No connection error | ☐ |
| `test_gmail_mcp_connection` | MCP server reachable | No connection error | ☐ |
| `test_create_document_returns_url` | `create_document` tool call | Returns valid Google Doc URL | ☐ |
| `test_idempotent_doc_update` | Run twice for same week | Second run calls `update_document`, not `create_document` | ☐ |
| `test_draft_created_in_gmail` | `create_draft` tool call | Draft appears in Gmail Drafts folder | ☐ |
| `test_draft_subject_format` | Draft metadata | Subject matches `"Weekly Pulse — Groww App | Week of YYYY-MM-DD"` | ☐ |
| `test_draft_contains_doc_url` | Draft body | Contains the Google Doc URL | ☐ |
| `test_no_direct_api_call` | Code inspection | No `requests.get("googleapis.com")` in codebase | ☐ |

#### End-to-End Test (manual)

Run `python src/main.py` with real Groww review data and verify:

- [ ] Terminal shows no unhandled exceptions
- [ ] A Google Doc is created/updated with correct title format
- [ ] Doc content matches the rendered pulse (themes, quotes, actions visible)
- [ ] Word count in Doc ≤ 250
- [ ] Gmail Drafts folder contains a new draft
- [ ] Draft is addressed to the configured recipient
- [ ] Draft subject is correctly formatted
- [ ] Draft body contains the Google Doc URL

### Exit Criteria — Phase 4 ✅

> **ALL must pass for the project to be considered DONE**

- [ ] All integration tests pass (`pytest tests/test_delivery.py` — 0 failures)
- [ ] End-to-end manual test: all 8 checklist items above confirmed ✅
- [ ] No direct Google API calls detected in codebase (grep check)
- [ ] Google Doc URL is valid and accessible
- [ ] Gmail draft is visible and sendable
- [ ] Total pipeline runtime documented (target: < 2 minutes)

---

## 📊 Overall Evaluation Scorecard

| Phase | Unit Tests | Integration | LLM Quality | Manual Review | **Status** |
|-------|-----------|-------------|-------------|---------------|------------|
| Phase 1 — Ingestion | ☐ | — | — | ☐ | 🔲 Not Started |
| Phase 2 — AI Pipeline | ☐ | — | ☐ | ☐ | 🔲 Not Started |
| Phase 3 — Assembly | ☐ | — | — | ☐ | 🔲 Not Started |
| Phase 4 — Delivery | ☐ | ☐ | — | ☐ | 🔲 Not Started |

**Legend:** ☐ Pending · ✅ Pass · ❌ Fail · 🔲 Not Started · 🟡 In Progress
