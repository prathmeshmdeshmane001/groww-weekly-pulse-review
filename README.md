# Groww Weekly Pulse Review 📈

An automated AI customer feedback intelligence engine and executive dashboard for Groww. It ingests public App Store & Google Play Store reviews, scrubs PII, clusters themes and sentiment, and delivers concise weekly pulses directly to executives via Google Docs, Gmail drafts, and an interactive modern web dashboard.

---

## ✨ Features

- **📊 Dynamic Executive Dashboard**:
  - Real-time KPI metrics (reviews analyzed, average rating, negative feedback proportion, active issue clusters).
  - Open-ended, reactive date horizon filtering (All Time, Latest Week, Last 7/14/30/60/90 Days, and Custom Start/End Date Range).
  - Rating breakdown (5★ to 1★) and platform split (Google Play vs Apple App Store).
  - Dynamically ranked top customer friction themes with volume, sentiment velocity, representative complaints, and suggested product actions.
  - Weekly sentiment trend charts and live review table.
- **📥 Ingestion & On-Demand Downloader**:
  - Live scrapers for Google Play Store (`google-play-scraper`) and Apple App Store (`iTunes RSS`).
  - Interactive UI modal to download and ingest historical reviews (4 to 52+ weeks).
- **🛡️ Privacy & Compliance**:
  - Automated regex-based scrubbing of phone numbers, email addresses, order IDs, account numbers, and personal names before LLM processing.
- **📝 Automated Weekly Pulse Generation**:
  - Generates executive pulses strictly under 250 words with executive summaries, top 3 issue clusters, authentic verbatim quotes, and tactical action ideas.
- **📤 Multi-Channel Delivery**:
  - One-click publishing to Google Docs via Google Workspace APIs and Gmail draft creation.
- **👤 Personalized User Onboarding**:
  - Individual profile customization (name, email, avatar initials) stored in browser storage.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons.
- **Backend & ML Pipeline**: Python 3.10+, Google GenAI SDK (Gemini 2.5 Flash), Google Workspace APIs (Docs & Gmail), Pydantic.
- **Testing**: Pytest (57/57 unit and integration tests passing).
- **Deployment**: Vercel ready (`vercel.json` configured).

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+ (for backend pipeline)

### 1. Frontend Development
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) to explore the dashboard.

### 2. Production Build
```bash
cd frontend
npm run build
```

### 3. Backend Pipeline & Tests
```bash
# Install Python dependencies
pip install -r requirements.txt

# Run full test suite
python -m pytest tests/
```

---

## 🌐 Deploy to Vercel

This repository is configured for one-click deployment on Vercel:

1. Import this repository in [Vercel](https://vercel.com/new).
2. Root directory: `./` (or `./frontend`)
3. Framework Preset: **Vite**
4. Build Command: `cd frontend && npm install && npm run build` (handled automatically by `vercel.json`)
5. Output Directory: `frontend/dist`

---

## 📄 License
MIT License.
