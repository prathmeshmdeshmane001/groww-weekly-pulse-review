# Problem Statement — Weekly Pulse Review

> **Project:** Groww App *(Milestone 3 — continuation of Milestone 2)*
> **Goal:** Transform raw mobile-store feedback into a concise weekly pulse that any stakeholder can scan in minutes — delivered to Google Docs and Gmail using MCP servers.

---

## 📋 Overview

App Store and Play Store reviews are publicly available. The challenge is not access — it is **signal extraction**: pulling out what matters, grouping it meaningfully, and surfacing it where the team already works.

This project builds an automated pipeline that:

1. Collects recent reviews for the **Groww App**
2. Clusters them into themes using an AI agent
3. Writes a structured weekly pulse document to **Google Docs** via MCP
4. Creates a ready-to-send draft in **Gmail** via MCP

The key principle: **no manual Google API wiring**. All Google Docs and Gmail interactions happen through MCP (Model Context Protocol) servers, keeping auth and HTTP plumbing out of your application code.

---

## 🔄 End-to-End Flow

```
App Store / Play Store Reviews (public export)
        │
        ▼
  Ingest & Parse Reviews  ──── last 8–12 weeks ────►  rating, title, text, date
        │
        ▼
  Theme Clustering (AI)   ──── max 5 themes ──────►  onboarding · KYC · payments
        │                                             statements · withdrawals
        ▼
  Weekly Pulse Generation ──── top 3 themes ──────►  themes + quotes + action ideas
        │                      3 quotes
        │                      3 action ideas
        ├──────────────────────────────────────────►  Google Docs  (via MCP server)
        │                                             → Creates / updates pulse doc
        └──────────────────────────────────────────►  Gmail        (via MCP server)
                                                      → Creates draft email w/ link
```

---

## 📦 Deliverables

### 1. Weekly One-Page Pulse Document *(Google Docs)*
Published to Google Docs via the **Google Docs MCP server**. Must include:

| Section | Requirement |
|---------|-------------|
| **Top Themes** | The 3 most prevalent themes from that week's reviews |
| **Real User Quotes** | 3 verbatim snippets from actual reviews — no invented wording |
| **Action Ideas** | 3 concrete, prioritized next steps grounded in the themes |

> Word limit: **≤ 250 words** — keep it scannable, not exhaustive.

### 2. Draft Email *(Gmail)*
Created in Gmail via the **Gmail MCP server** — addressed to yourself or a team alias. Must contain the pulse note directly or a clear link to the Google Doc.

---

## 👥 Who This Helps

| Audience | Pain Point Solved |
|----------|-------------------|
| **Product / Growth Teams** | Prioritize what to fix next based on real user signals, not assumptions |
| **Support Teams** | Align support messaging with what users are actually saying this week |
| **Leadership** | One-page health check — no need to drown in raw review feeds |

---

## 🛠️ What You Must Build

### Step 1 — Review Ingestion
- Import reviews from the **last 8–12 weeks**
- Required fields: `rating`, `title`, `text`, `date`
- Source: public App Store & Play Store exports only *(no login-gated scraping)*

### Step 2 — Theme Clustering
- Group all reviews into **at most 5 themes**
- Suggested themes for Groww: `onboarding`, `KYC`, `payments`, `statements`, `withdrawals`
- Adapt theme labels to fit the actual review content

### Step 3 — Weekly Pulse Generation
- Select the **top 3 themes** (by review volume or severity)
- Pick **3 real user quotes** (verbatim, PII-stripped)
- Draft **3 action ideas** grounded in those themes
- Keep the entire note **≤ 250 words**

### Step 4 — Google Docs Integration *(via MCP)*
- Use the **Google Docs MCP server** to create or update the weekly pulse document
- Do **not** call the Google Docs REST API directly
- The MCP server exposes tools such as `create_document` and `update_document` — use those

### Step 5 — Gmail Integration *(via MCP)*
- Use the **Gmail MCP server** to create a draft email
- Do **not** call the Gmail REST API directly
- The MCP server exposes tools such as `create_draft` — use those
- The draft should be addressed to yourself or a designated team alias

---

## 🔌 MCP Server Integration — Key Details

MCP (Model Context Protocol) servers act as a standardized bridge between your agent and Google services. They handle OAuth, token refresh, and HTTP plumbing so your code only calls named tools.

| Service | Integration Method | What NOT to do |
|---------|--------------------|----------------|
| **Google Docs** | Google Docs MCP server → `create_document`, `update_document` | Do not write a bespoke OAuth + REST client |
| **Gmail** | Gmail MCP server → `create_draft`, `send_email` | Do not call Gmail REST API (`gmail.users.drafts.create`) directly |

> **Why MCP-first?**
> It keeps your integration consistent with the course tooling, eliminates duplicated auth/HTTP code, and makes the agent portable across environments that provide the same MCP servers.

---

## ⚠️ Key Constraints

| Constraint | Rule |
|------------|------|
| **Review Source** | Public exports only — no scraping behind store logins or ToS-violating automation |
| **Theme Limit** | Maximum **5 themes** for clustering; pulse highlights the top **3** |
| **Note Length** | Scannable and **≤ 250 words** |
| **Privacy / PII** | No usernames, emails, device IDs, or any identifiable reviewer data in any artifact — quotes must be anonymized before inclusion |
| **API Usage** | Google Docs and Gmail must be accessed via their respective **MCP servers**, not direct REST API calls |