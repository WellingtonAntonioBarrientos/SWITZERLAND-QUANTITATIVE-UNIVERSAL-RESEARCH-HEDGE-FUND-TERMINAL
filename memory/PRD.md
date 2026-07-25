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
- Frontend: React (App.js ~4,085 lines — refactor pending P0), TailwindCSS, react-globe.gl, react-plotly.js (Surface3D.jsx)
- Backend: FastAPI + MongoDB (paper_accounts persisted), yfinance market data
- AI: Claude via emergentintegrations (Emergent LLM key) — wellington_orchestrator.py routes standard/advanced modes with per-request model selection

## Implemented (chronological highlights)
- Core 14-module dashboard, 13F filings, paper trading + funds paper trading (150 orders, 16 positions, ~$100.3M)
- Wellington AI orchestrator (smart mode auto-detection: standard/code_gen/deep_analysis/research/strategy_builder/debate)
- Dec 2025 fork:
  - Auth fully removed (open access)
  - Claude model picker in Wellington chat: Sonnet 4.6 (default), Opus 4.8, Haiku 4.5, Sonnet 4.5; GET /api/wellington/models; POST /api/wellington/chat accepts `model`, returns `model_used`
  - Fixed pre-existing crash: Wellington functions were trapped in resetAccount's unclosed catch block
  - Code review fixes: deleted dead auth files (hooks/useAuth.js, utils/api.js, components/auth/*), console.error → dev-gated logError, 17 list keys index→stable ids, orchestrator process_query split into _handle_* dispatch, eslint exhaustive-deps annotations
  - Fixed iteration-4 HIGH regression: watchlist key={item.position} (symbols repeat across funds)
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
- P0: Refactor App.js into /src/pages/ + /src/components/ (QuantDashboard, PaperTradingPage, SECFilingsPage, WellingtonChat, Sidebar...)
- P2: Wellington AI streaming responses (also fixes timeout)
- P3: More 3D visualizations, real-time news feed for World Intel, chart export, watchlist row data-testids

## Test Reports
- /app/test_reports/iteration_4.json (regression suite, 94% backend)
- /app/test_reports/iteration_5.json (branding + badge + watchlist key fix — all pass)
