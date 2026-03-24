# QuantFlow Terminal - Product Requirements Document

## Project Overview
A comprehensive hedge fund quantitative trading platform with 14+ modules for market analysis, strategy management, SEC filings analysis, and enterprise automation.

## Original Problem Statement
Build a quant financial application with: quant dashboard, macro regime, world intel map, terminal, research queue, approvals, system health, hedge fund automation v1, hedge fund automation v2, and hedge fund hub. Plus 10 specific hedge fund strategies, 13F SEC filings with AI retrieval, global financial heatmap, and enhanced automation hub.

## User Personas
1. **Quantitative Traders** - Need real-time data, charts, and quick command access
2. **Hedge Fund Managers** - Require strategy oversight, approvals, and risk monitoring
3. **Financial Analysts** - Use research queue and AI analysis for insights
4. **Operations Staff** - Monitor system health and process approvals
5. **Compliance Officers** - Use automation hub for regulatory monitoring

## Core Requirements (Static)
- Dark terminal aesthetic (Bloomberg-style toggle available)
- High information density
- Real-time data updates
- AI-powered analysis (Claude Sonnet 4.5)
- No authentication for MVP

## What's Been Implemented (Jan 2026)

### Backend (FastAPI + MongoDB)
- `/api/dashboard/summary` - Hub metrics
- `/api/strategies` - 10 hedge fund strategies
- `/api/strategies/{id}/analyze` - AI strategy analysis
- `/api/sec/13f` - Top 10 hedge fund 13F filings
- `/api/sec/13f/{id}/analyze` - AI 13F analysis
- `/api/market/data` - Mock market data
- `/api/market/chart/{symbol}` - OHLCV chart data
- `/api/market/indices` - 16 global indices
- `/api/market/heatmap` - Regional heatmap data
- `/api/macro/regime` - Economic regime data
- `/api/macro/correlation` - Correlation matrix
- `/api/intel/events` - Global intel events
- `/api/terminal/execute` - Terminal commands
- `/api/research/tasks` - Research task CRUD + AI
- `/api/approvals` - Approval workflow
- `/api/system/health` - Service health
- `/api/automation/modules` - 5 automation modules
- `/api/automation/modules/{id}/analyze` - AI optimization
- `/api/automation/rules` - V1 rule automation
- `/api/automation/strategies` - V2 code automation

### Frontend (React + Tailwind)
1. **Hub** - Command center with metrics
2. **Strategies** - 10 hedge fund strategies with AI analysis
3. **13F SEC Filings** - Top 10 hedge fund quarterly holdings
4. **Global Heatmap** - 16 world indices with red/green coding
5. **Quant Dashboard** - Market data and charts
6. **Macro Regime** - Economic indicators
7. **World Intel Map** - Global events
8. **Terminal** - Command-line interface
9. **Research Queue** - AI-powered research
10. **Approvals** - Workflow management
11. **System Health** - Infrastructure monitoring
12. **Automation Hub** - 5 enterprise modules
13. **Automation V1** - Rule builder
14. **Automation V2** - Code editor

### View Modes
- **Modern Mode** - Default dark theme
- **Bloomberg Mode** - Orange/green terminal style

### 10 Hedge Fund Strategies
1. Long/Short Equity
2. Global Macro
3. Event-Driven/Distressed Debt
4. Quant Multi-Strategy
5. Credit Risk/Private Credit
6. Relative Value Arbitrage
7. AI/ML Trading
8. Active AMCs
9. CTAs/Trend Following
10. Inflation-Hedged Real Assets

### 10 SEC 13F Funds Tracked
1. Bridgewater Associates ($124.5B)
2. Renaissance Technologies ($98.2B)
3. Citadel Advisors ($87.6B)
4. Two Sigma ($72.4B)
5. Millennium Management ($65.8B)
6. D.E. Shaw ($52.1B)
7. Point72 ($45.2B)
8. Viking Global ($42.6B)
9. Elliott Management ($38.9B)
10. Baupost Group ($28.5B)

### 5 Automation Modules
1. **Automated Trading & Investment Strategy** - Pattern detection, trade execution
2. **Research & Data Aggregation** - Real-time data ingestion
3. **Compliance & Risk Management** - Regulatory monitoring, VaR
4. **Operational & Middle Office** - NAV, reconciliation, settlements
5. **Investor Relations & Reporting** - AI chatbots, performance reports

## Prioritized Backlog

### P0 (Critical)
- [ ] Real market data API integration
- [ ] WebSocket for real-time updates

### P1 (High Priority)
- [ ] User authentication
- [ ] Strategy backtesting engine
- [ ] Real 13F SEC filing API integration

### P2 (Medium Priority)
- [ ] Historical performance tracking
- [ ] Custom alerts and notifications
- [ ] Export to PDF/Excel

## Technical Architecture
- **Frontend**: React 19, Tailwind CSS, Recharts
- **Backend**: FastAPI, Motor (async MongoDB)
- **Database**: MongoDB
- **AI**: Claude Sonnet 4.5 via Emergent LLM key

## Notes
- Market data, indices, and 13F filings are MOCKED
- AI features use Emergent LLM key
- No authentication in MVP phase
