# QuantFlow Terminal - Product Requirements Document

## Project Overview
A comprehensive hedge fund quantitative trading platform with 11 modules for market analysis, strategy management, and automation.

## Original Problem Statement
Build a quant financial application with: quant dashboard, macro regime, world intel map, terminal, research queue, approvals, system health, hedge fund automation v1, hedge fund automation v2, and hedge fund hub. Plus 10 specific hedge fund strategies.

## User Personas
1. **Quantitative Traders** - Need real-time data, charts, and quick command access
2. **Hedge Fund Managers** - Require strategy oversight, approvals, and risk monitoring
3. **Financial Analysts** - Use research queue and AI analysis for insights
4. **Operations Staff** - Monitor system health and process approvals

## Core Requirements (Static)
- Dark terminal aesthetic (Bloomberg-style)
- High information density
- Real-time data updates
- AI-powered analysis (Claude Sonnet 4.5)
- No authentication for MVP

## What's Been Implemented (Jan 2026)

### Backend (FastAPI + MongoDB)
- `/api/dashboard/summary` - Hub metrics
- `/api/strategies` - 10 hedge fund strategies
- `/api/strategies/{id}/analyze` - AI strategy analysis
- `/api/market/data` - Mock market data
- `/api/market/chart/{symbol}` - OHLCV chart data
- `/api/macro/regime` - Economic regime data
- `/api/macro/correlation` - Correlation matrix
- `/api/intel/events` - Global intel events
- `/api/terminal/execute` - Terminal commands
- `/api/research/tasks` - Research task CRUD + AI analysis
- `/api/approvals` - Approval workflow
- `/api/system/health` - Service health
- `/api/automation/rules` - V1 rule automation
- `/api/automation/strategies` - V2 code automation

### Frontend (React + Tailwind)
- Hub page with metrics and quick navigation
- Strategies page with 10 strategies + AI analysis
- Quant Dashboard with charts (Recharts)
- Macro Regime with indicators and correlation
- World Intel Map with event markers
- Terminal with command execution
- Research Queue with AI analysis
- Approvals table with actions
- System Health monitoring
- Automation V1 (rule builder)
- Automation V2 (code editor)

### 10 Hedge Fund Strategies
1. Long/Short Equity (Equity)
2. Global Macro (Macro)
3. Event-Driven/Distressed Debt (Credit)
4. Quant Multi-Strategy (Quantitative)
5. Credit Risk Strategies/Private Credit (Credit)
6. Relative Value Arbitrage (Arbitrage)
7. AI and Machine Learning Trading (Quantitative)
8. Active Asset Manager Certificates (Structured)
9. CTAs/Trend Following (Managed Futures)
10. Inflation-Hedged Real Assets (Real Assets)

## Prioritized Backlog

### P0 (Critical)
- [ ] Real market data API integration (Alpha Vantage/CoinGecko)
- [ ] WebSocket for real-time updates

### P1 (High Priority)
- [ ] User authentication (JWT or Google OAuth)
- [ ] Strategy backtesting engine
- [ ] Portfolio allocation optimizer
- [ ] Real trade execution integration

### P2 (Medium Priority)
- [ ] Historical performance tracking
- [ ] Custom alerts and notifications
- [ ] Multi-user collaboration
- [ ] Advanced charting (TradingView integration)

### Future/Nice-to-Have
- Mobile responsive design
- Email/SMS alert notifications
- Custom dashboard layouts
- Export to PDF/Excel

## Technical Architecture
- **Frontend**: React 19, Tailwind CSS, Recharts, Radix UI
- **Backend**: FastAPI, Motor (async MongoDB)
- **Database**: MongoDB
- **AI**: Claude Sonnet 4.5 via Emergent LLM key
- **Design**: Quant Noir dark theme (Space Grotesk, JetBrains Mono)

## Notes
- Market data is currently MOCKED - awaiting user API keys
- AI features use Emergent LLM key (universal key)
- No authentication in MVP phase
