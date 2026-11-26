# Switzerland Quantitative Universal Hedge Fund Terminal (SQUHF) — PRD

## Project Overview
A **private, open-access** hedge fund quantitative trading platform with 14+ modules for market analysis, strategy management, SEC filings analysis, paper trading, and AI-powered analysis.
Branding: **Switzerland Quantitative Universal Hedge Fund Terminal by Wellington Antonio Barrientos** (logo "SQ", short name "SQUHF"). "Made with Emergent" badge removed (Jul 2026).

## Owner
- Wellington Antonio Barrientos
- Internal data key (NOT a credential): `barrientoswellingtonantonio@gmail.com` — MongoDB `paper_accounts.user_id`. Do not change (preserves 150-order portfolio).

## Original Problem Statement
Build a private quant financial application with quant dashboard, macro regime, world intel map, terminal, research queue, approvals, system health, hedge fund automation, 10 hedge fund strategies, 13F SEC filings with AI retrieval, global financial heatmap, thinkorswim-style Paper Trading ($100M), Funds Paper Trading 1.0, and Wellington AI (multimodal Claude chat with smart mode routing).

## Authentication
- **REMOVED (Dec 2025 fork)** at user request. App opens directly to /dashboard. All `/api/*` endpoints are open (verify_token_dep returns owner unconditionally). Old /api/auth/* endpoints deleted.

## Architecture
- Frontend: React — REFACTORED (Nov 2026): App.js is 65 lines (routing only); pages in src/pages/*.jsx (16 pages), shared in src/components/ (Sidebar, Shared, CompositeStrategyCard, HedgeFundWatchlist, FundComparison, Surface3D), src/lib/config.js (API, logError). TailwindCSS, react-globe.gl, react-plotly.js
- Backend: FastAPI + MongoDB (paper_accounts persisted), yfinance market data with in-memory price cache (TTL 120s + stale fallback)
- AI: Claude + ChatGPT via emergentintegrations 0.2.2 (Emergent LLM key) — wellington_orchestrator.py routes modes; SSE streaming endpoint /api/wellington/chat/stream (token-by-token for standard, keepalive+final for advanced modes)

## Implemented (chronological highlights)
- Core 14-module dashboard, 13F filings (15 funds since Nov 2026: 10 original + Jane Street, SIG, HRT, Optiver, Jump Trading; Millennium was already included), paper trading + funds paper trading (150 orders, 16 positions, ~$100.3M); watchlist = top 5 × 15 funds = 75 items
- Wellington AI orchestrator (smart mode auto-detection: standard/code_gen/deep_analysis/research/strategy_builder/debate)
- Dec 2025 fork:
  - Auth fully removed (open access)
  - Model picker in Wellington chat: Claude Sonnet 4.6 (default), Opus 4.8, Haiku 4.5, Sonnet 4.5 + ChatGPT GPT-6 Astra, GPT-6 Sol, GPT-5.6 Terra, GPT-6 Luna (Nov 2026); GET /api/wellington/models; POST /api/wellington/chat accepts `model`, returns `model_used`; per-model provider routing (anthropic/openai)
  - Fixed pre-existing crash: Wellington functions were trapped in resetAccount's unclosed catch block
  - Code review fixes: deleted dead auth files (hooks/useAuth.js, utils/api.js, components/auth/*), console.error → dev-gated logError, 17 list keys index→stable ids, orchestrator process_query split into _handle_* dispatch, eslint exhaustive-deps annotations
  - Fixed iteration-4 HIGH regression: watchlist key={item.position} (symbols repeat across funds)
- Nov 2026: Fund Alerts — daily 13F diff engine (.emergent/crons.yml cron 13:00 UTC + manual Check Now) creating ENTERED/EXITED/NEW_FILING alerts, alerts panel with unread badge on /sec-filings
- Jul 2026: Rebranded to SQUHF Terminal (index.html title/meta, sidebar, profile, terminal boot, API title); removed Emergent badge script

## Security (audit remediated Jul 2026)
- Open access is an accepted design decision (no auth). Audit-fixed beyond that: SSRF guard on analyze-url, removed hardcoded LLM key (fail-closed), 10MB upload caps + 8000-char chat cap, in-memory per-IP rate limiting on LLM/analyze-url/upload, reset requires confirm=='RESET-ACCOUNT', generic error messages, CORS credentials off under wildcard.
- Residual (accepted/backlog): open access means anyone with URL can use paid AI + place paper trades; rate limiter is per-process (move to Redis if scaling >1 worker).

## Known Issues / Notes
- EMERGENT_LLM_KEY budget EXHAUSTED — Wellington AI live replies return budget-exceeded error until user tops up (Profile → Universal Key → Add Balance)
- Code-generation Wellington prompts can exceed 60s ingress timeout (worse while budget errors trigger retries) — P2: streaming/background task
- Non-blocking hydration warning "<span> cannot be child of <option>" from library internals (not our code) — P3
- Wellington view-mode CSS inconsistencies — P2

## Backlog
- DONE (Nov 2026): App.js refactor, streaming responses, fund comparison view, bulk trades for new firms
- P2: Extract PaperTradingPage sub-components (still ~980 lines: WellingtonPanel, OrderEntry, PositionsPanel)
- P3: More 3D visualizations, real-time news feed for World Intel, chart export, watchlist row data-testids

## Test Reports
- /app/test_reports/iteration_4.json (regression suite, 94% backend)
- /app/test_reports/iteration_5.json (branding + badge + watchlist key fix — all pass)

## 2026-06 (cont.): Live SEC EDGAR 13F Feed + Email Alerts — COMPLETE
- backend/edgar_service.py: fetches latest 13F-HR per fund from SEC EDGAR (data.sec.gov submissions API + infotable XML parsing), CUSIP-less ticker mapping via company_tickers.json with abbreviation expansion + ETF prefix map, symbol dedup. Fixed 5 wrong CIKs (millennium 1273087, elliott 1791786, hudsonriver 1475597, optiver 1859606, jumptrading 1831577).
- Live filings stored in Mongo live_filings (accession-based idempotency); get_all_funds() merges live over static for /api/sec/13f and alert engine. Watchlist intentionally stays static.
- First live ingest per fund = silent rebaseline (single NEW_FILING alert, no entry/exit flood). Future accession changes trigger ENTERED/EXITED diffs.
- backend/email_service.py: Emergent Managed Email (Resend proxy, EMERGENT_EMAIL_KEY in backend/.env). Digest email (max 25 rows) sent to ALERT_EMAIL_TO=barrientoswellingtonantonio@gmail.com on new alerts.
- Cron /api/cron/check-13f now runs full EDGAR refresh + diff in background; manual /api/alerts/run-check?refresh=true does the same synchronously.
- Verified: all 15 funds show real Q3 2026 filings (e.g. Citadel $899.6B AUM, filed 2026-11-16); idempotent rerun = 0 alerts; email sends 202; cron 401/200 auth; UI screenshot OK.
- Known minor: ~5-10% of holdings keep name-slug symbols (e.g. SELECT-SECTO) where EDGAR issuer names cannot be confidently mapped to tickers.
