from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import random
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="QuantFlow Terminal API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ============== MODELS ==============

class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class MarketData(BaseModel):
    symbol: str
    price: float
    change: float
    change_percent: float
    volume: int
    timestamp: str

class MacroIndicator(BaseModel):
    name: str
    value: float
    previous: float
    trend: str
    category: str

class RegimeData(BaseModel):
    current_regime: str
    confidence: float
    indicators: List[MacroIndicator]

class IntelEvent(BaseModel):
    id: str
    lat: float
    lng: float
    event_type: str
    severity: str
    title: str
    description: str
    timestamp: str
    region: str

class ResearchTask(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    status: str = "PENDING"
    priority: str = "MEDIUM"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    ai_analysis: Optional[str] = None
    tags: List[str] = []

class ResearchTaskCreate(BaseModel):
    title: str
    description: str
    priority: str = "MEDIUM"
    tags: List[str] = []

class ApprovalRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str
    title: str
    description: str
    requester: str
    amount: Optional[float] = None
    status: str = "PENDING"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    risk_score: float = 0.0

class ApprovalAction(BaseModel):
    action: str  # "approve" or "reject"
    notes: Optional[str] = None

class SystemHealthData(BaseModel):
    service: str
    status: str
    latency_ms: float
    cpu_usage: float
    memory_usage: float
    uptime_hours: float
    last_check: str

class AutomationRule(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    condition_type: str
    condition_value: float
    action_type: str
    action_value: str
    enabled: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    triggered_count: int = 0

class AutomationRuleCreate(BaseModel):
    name: str
    condition_type: str
    condition_value: float
    action_type: str
    action_value: str

class AutomationStrategy(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    code: str
    language: str = "python"
    enabled: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    last_run: Optional[str] = None
    status: str = "DRAFT"

class AutomationStrategyCreate(BaseModel):
    name: str
    code: str
    language: str = "python"

class TerminalCommand(BaseModel):
    command: str

class AIQuery(BaseModel):
    query: str
    context: Optional[str] = None

class HedgeFundStrategy(BaseModel):
    id: str
    name: str
    category: str
    description: str
    risk_level: str
    expected_return: str
    correlation: str
    key_factors: List[str]
    status: str = "ACTIVE"

# Predefined Hedge Fund Strategies
HEDGE_FUND_STRATEGIES = [
    HedgeFundStrategy(
        id="long-short-equity",
        name="Long/Short Equity",
        category="Equity",
        description="Fundamental managers focusing on high-dispersion markets to identify mispriced, high-quality companies, offering alpha over passive holding.",
        risk_level="MEDIUM",
        expected_return="8-15%",
        correlation="0.4-0.6",
        key_factors=["Stock Selection", "Market Dispersion", "Fundamental Analysis", "Alpha Generation"]
    ),
    HedgeFundStrategy(
        id="global-macro",
        name="Global Macro",
        category="Macro",
        description="Strategies that capitalize on volatility, geopolitical shifts, and changing monetary policies across currencies, bonds, and commodities.",
        risk_level="HIGH",
        expected_return="10-20%",
        correlation="0.1-0.3",
        key_factors=["Geopolitical Analysis", "Monetary Policy", "Currency Dynamics", "Volatility Trading"]
    ),
    HedgeFundStrategy(
        id="event-driven-distressed",
        name="Event-Driven/Distressed Debt",
        category="Credit",
        description="Capitalizing on mergers, acquisitions, and corporate restructurings, which are expected to increase as high-debt firms refinance in 2026.",
        risk_level="HIGH",
        expected_return="12-18%",
        correlation="0.3-0.5",
        key_factors=["M&A Activity", "Corporate Restructuring", "Debt Refinancing", "Special Situations"]
    ),
    HedgeFundStrategy(
        id="quant-multi-strategy",
        name="Quant Multi-Strategy",
        category="Quantitative",
        description="Data-driven and automated trading strategies designed to maintain low correlation to traditional markets while enhancing returns.",
        risk_level="MEDIUM",
        expected_return="10-15%",
        correlation="0.0-0.2",
        key_factors=["Algorithmic Trading", "Statistical Arbitrage", "Factor Exposure", "Portfolio Optimization"]
    ),
    HedgeFundStrategy(
        id="credit-risk-private",
        name="Credit Risk Strategies/Private Credit",
        category="Credit",
        description="Capitalizing on elevated interest rates by lending directly to companies, often focusing on private lending for better yield.",
        risk_level="MEDIUM-HIGH",
        expected_return="9-14%",
        correlation="0.2-0.4",
        key_factors=["Interest Rate Environment", "Direct Lending", "Credit Analysis", "Yield Enhancement"]
    ),
    HedgeFundStrategy(
        id="relative-value-arbitrage",
        name="Relative Value Arbitrage",
        category="Arbitrage",
        description="Exploiting price discrepancies between closely related financial instruments, such as fixed-income securities or convertible bonds.",
        risk_level="LOW-MEDIUM",
        expected_return="6-10%",
        correlation="0.1-0.3",
        key_factors=["Price Discrepancies", "Fixed Income", "Convertible Bonds", "Market Neutral"]
    ),
    HedgeFundStrategy(
        id="ai-ml-trading",
        name="AI and Machine Learning Trading",
        category="Quantitative",
        description="Systematic strategies using artificial intelligence to detect complex, non-linear market patterns faster than traditional models.",
        risk_level="MEDIUM-HIGH",
        expected_return="12-20%",
        correlation="0.0-0.2",
        key_factors=["Neural Networks", "Pattern Recognition", "Alternative Data", "Real-time Processing"]
    ),
    HedgeFundStrategy(
        id="active-amcs",
        name="Active Asset Manager Certificates (AMCs)",
        category="Structured",
        description="Tailor-made structured products that allow for flexible, often high-frequency, rebalancing across specialized niche markets.",
        risk_level="MEDIUM",
        expected_return="8-12%",
        correlation="0.2-0.4",
        key_factors=["Structured Products", "Niche Markets", "Flexible Rebalancing", "Custom Exposure"]
    ),
    HedgeFundStrategy(
        id="cta-trend-following",
        name="Commodity Trading Advisors (CTAs)/Trend Following",
        category="Managed Futures",
        description="Trend-following programs designed to profit from sharp moves in commodity prices and currency fluctuations.",
        risk_level="MEDIUM-HIGH",
        expected_return="8-15%",
        correlation="-0.2-0.1",
        key_factors=["Trend Detection", "Commodity Markets", "Currency Trading", "Momentum Signals"]
    ),
    HedgeFundStrategy(
        id="inflation-hedged-real-assets",
        name="Inflation-Hedged Real Assets",
        category="Real Assets",
        description="Specialized funds targeting hard assets, including private real estate and commodities, to protect capital from currency devaluation.",
        risk_level="LOW-MEDIUM",
        expected_return="6-10%",
        correlation="0.1-0.3",
        key_factors=["Real Estate", "Commodities", "Inflation Protection", "Capital Preservation"]
    )
]

# ============== MOCK DATA GENERATORS ==============

def generate_mock_market_data():
    symbols = ["BTC/USD", "ETH/USD", "SPY", "QQQ", "AAPL", "MSFT", "GOOGL", "NVDA", "TSLA", "GLD"]
    data = []
    for symbol in symbols:
        base_price = random.uniform(50, 50000) if "BTC" in symbol else random.uniform(10, 500)
        change = random.uniform(-5, 5)
        data.append(MarketData(
            symbol=symbol,
            price=round(base_price, 2),
            change=round(change, 2),
            change_percent=round(change / base_price * 100, 2),
            volume=random.randint(100000, 10000000),
            timestamp=datetime.now(timezone.utc).isoformat()
        ))
    return data

def generate_mock_macro_data():
    indicators = [
        MacroIndicator(name="Fed Funds Rate", value=5.25, previous=5.00, trend="up", category="rates"),
        MacroIndicator(name="CPI YoY", value=3.2, previous=3.5, trend="down", category="inflation"),
        MacroIndicator(name="GDP Growth", value=2.1, previous=1.9, trend="up", category="growth"),
        MacroIndicator(name="Unemployment", value=3.8, previous=3.9, trend="down", category="labor"),
        MacroIndicator(name="10Y Treasury", value=4.35, previous=4.20, trend="up", category="rates"),
        MacroIndicator(name="VIX", value=14.5, previous=16.2, trend="down", category="volatility"),
        MacroIndicator(name="DXY Index", value=104.2, previous=103.8, trend="up", category="currency"),
        MacroIndicator(name="Oil (WTI)", value=78.5, previous=76.2, trend="up", category="commodities"),
    ]
    regimes = ["RISK_ON", "RISK_OFF", "STAGFLATION", "GOLDILOCKS", "REFLATION"]
    return RegimeData(
        current_regime=random.choice(regimes),
        confidence=round(random.uniform(0.6, 0.95), 2),
        indicators=indicators
    )

def generate_mock_intel_events():
    events = [
        IntelEvent(id="1", lat=40.7128, lng=-74.0060, event_type="ECONOMIC", severity="HIGH", 
                   title="Fed Policy Update", description="Federal Reserve signals potential rate cut", 
                   timestamp=datetime.now(timezone.utc).isoformat(), region="North America"),
        IntelEvent(id="2", lat=51.5074, lng=-0.1278, event_type="GEOPOLITICAL", severity="MEDIUM",
                   title="UK Trade Deal", description="New trade agreement negotiations with EU",
                   timestamp=datetime.now(timezone.utc).isoformat(), region="Europe"),
        IntelEvent(id="3", lat=35.6762, lng=139.6503, event_type="MARKET", severity="LOW",
                   title="BOJ Intervention", description="Bank of Japan currency intervention",
                   timestamp=datetime.now(timezone.utc).isoformat(), region="Asia"),
        IntelEvent(id="4", lat=31.2304, lng=121.4737, event_type="ECONOMIC", severity="HIGH",
                   title="China PMI Data", description="Manufacturing PMI beats expectations",
                   timestamp=datetime.now(timezone.utc).isoformat(), region="Asia"),
        IntelEvent(id="5", lat=25.2048, lng=55.2708, event_type="COMMODITIES", severity="MEDIUM",
                   title="OPEC Meeting", description="Oil production cut discussions",
                   timestamp=datetime.now(timezone.utc).isoformat(), region="Middle East"),
    ]
    return events

def generate_mock_system_health():
    services = [
        {"service": "Market Data Feed", "base_latency": 12},
        {"service": "Order Execution", "base_latency": 5},
        {"service": "Risk Engine", "base_latency": 25},
        {"service": "AI Analysis", "base_latency": 150},
        {"service": "Database Primary", "base_latency": 8},
        {"service": "Database Replica", "base_latency": 10},
        {"service": "WebSocket Server", "base_latency": 3},
        {"service": "Cache Layer", "base_latency": 2},
    ]
    health_data = []
    for svc in services:
        status = random.choices(["HEALTHY", "DEGRADED", "DOWN"], weights=[0.85, 0.12, 0.03])[0]
        health_data.append(SystemHealthData(
            service=svc["service"],
            status=status,
            latency_ms=round(svc["base_latency"] * random.uniform(0.8, 1.5), 1),
            cpu_usage=round(random.uniform(10, 80), 1),
            memory_usage=round(random.uniform(30, 90), 1),
            uptime_hours=round(random.uniform(100, 720), 1),
            last_check=datetime.now(timezone.utc).isoformat()
        ))
    return health_data

# ============== API ROUTES ==============

@api_router.get("/")
async def root():
    return {"message": "QuantFlow Terminal API", "version": "1.0.0"}

# Market Data Endpoints
@api_router.get("/market/data", response_model=List[MarketData])
async def get_market_data():
    return generate_mock_market_data()

@api_router.get("/market/chart/{symbol}")
async def get_chart_data(symbol: str, period: str = "1D"):
    # Generate mock OHLCV data
    data_points = {"1D": 24, "1W": 168, "1M": 720, "3M": 2160}
    num_points = data_points.get(period, 24)
    base_price = 100 if symbol not in ["BTC/USD", "ETH/USD"] else 40000
    
    chart_data = []
    current_price = base_price
    for i in range(num_points):
        open_price = current_price
        high = open_price * random.uniform(1.0, 1.02)
        low = open_price * random.uniform(0.98, 1.0)
        close = random.uniform(low, high)
        current_price = close
        chart_data.append({
            "timestamp": (datetime.now(timezone.utc).timestamp() - (num_points - i) * 3600) * 1000,
            "open": round(open_price, 2),
            "high": round(high, 2),
            "low": round(low, 2),
            "close": round(close, 2),
            "volume": random.randint(10000, 100000)
        })
    return {"symbol": symbol, "period": period, "data": chart_data}

# Macro Regime Endpoints
@api_router.get("/macro/regime", response_model=RegimeData)
async def get_macro_regime():
    return generate_mock_macro_data()

@api_router.get("/macro/correlation")
async def get_correlation_matrix():
    assets = ["SPY", "TLT", "GLD", "DXY", "VIX", "BTC"]
    matrix = {}
    for asset in assets:
        matrix[asset] = {}
        for other in assets:
            if asset == other:
                matrix[asset][other] = 1.0
            else:
                matrix[asset][other] = round(random.uniform(-0.8, 0.8), 2)
    return {"assets": assets, "matrix": matrix}

# Intel Map Endpoints
@api_router.get("/intel/events", response_model=List[IntelEvent])
async def get_intel_events():
    return generate_mock_intel_events()

# Research Queue Endpoints
@api_router.get("/research/tasks", response_model=List[ResearchTask])
async def get_research_tasks():
    tasks = await db.research_tasks.find({}, {"_id": 0}).to_list(100)
    return tasks

@api_router.post("/research/tasks", response_model=ResearchTask)
async def create_research_task(task: ResearchTaskCreate):
    task_obj = ResearchTask(**task.model_dump())
    await db.research_tasks.insert_one(task_obj.model_dump())
    return task_obj

@api_router.post("/research/tasks/{task_id}/analyze")
async def analyze_research_task(task_id: str):
    task = await db.research_tasks.find_one({"id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Use Claude for analysis
    try:
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            return {"error": "AI key not configured"}
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"research-{task_id}",
            system_message="You are a senior quantitative analyst at a hedge fund. Provide concise, actionable research insights."
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        
        prompt = f"Analyze this research topic for a hedge fund:\n\nTitle: {task['title']}\n\nDescription: {task['description']}\n\nProvide key insights, potential alpha opportunities, and risk factors in 3-4 bullet points."
        
        response = await chat.send_message(UserMessage(text=prompt))
        
        await db.research_tasks.update_one(
            {"id": task_id},
            {"$set": {"status": "ANALYZED", "ai_analysis": response}}
        )
        
        return {"task_id": task_id, "analysis": response, "status": "ANALYZED"}
    except Exception as e:
        logging.error(f"AI analysis error: {e}")
        return {"task_id": task_id, "error": str(e), "status": "ERROR"}

@api_router.delete("/research/tasks/{task_id}")
async def delete_research_task(task_id: str):
    result = await db.research_tasks.delete_one({"id": task_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted"}

# Approvals Endpoints
@api_router.get("/approvals", response_model=List[ApprovalRequest])
async def get_approvals():
    approvals = await db.approvals.find({}, {"_id": 0}).to_list(100)
    if not approvals:
        # Seed some mock approvals
        mock_approvals = [
            ApprovalRequest(type="TRADE", title="Large BTC Position", description="Buy 50 BTC at market", 
                          requester="trader_001", amount=2000000, risk_score=0.75),
            ApprovalRequest(type="STRATEGY", title="New Momentum Strategy", description="Deploy momentum algo on SPY",
                          requester="quant_003", risk_score=0.45),
            ApprovalRequest(type="WITHDRAWAL", title="Fund Withdrawal", description="Client withdrawal request",
                          requester="ops_002", amount=500000, risk_score=0.2),
        ]
        for approval in mock_approvals:
            await db.approvals.insert_one(approval.model_dump())
        return mock_approvals
    return approvals

@api_router.post("/approvals/{approval_id}/action")
async def process_approval(approval_id: str, action: ApprovalAction):
    status = "APPROVED" if action.action == "approve" else "REJECTED"
    result = await db.approvals.update_one(
        {"id": approval_id},
        {"$set": {"status": status}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Approval not found")
    return {"message": f"Approval {status.lower()}", "id": approval_id}

# System Health Endpoints
@api_router.get("/system/health", response_model=List[SystemHealthData])
async def get_system_health():
    return generate_mock_system_health()

@api_router.get("/system/alerts")
async def get_system_alerts():
    alerts = [
        {"id": "1", "level": "WARNING", "message": "Market data latency elevated", "timestamp": datetime.now(timezone.utc).isoformat()},
        {"id": "2", "level": "INFO", "message": "Daily backup completed", "timestamp": datetime.now(timezone.utc).isoformat()},
    ]
    return alerts

# Automation V1 (Rule-based) Endpoints
@api_router.get("/automation/rules", response_model=List[AutomationRule])
async def get_automation_rules():
    rules = await db.automation_rules.find({}, {"_id": 0}).to_list(100)
    return rules

@api_router.post("/automation/rules", response_model=AutomationRule)
async def create_automation_rule(rule: AutomationRuleCreate):
    rule_obj = AutomationRule(**rule.model_dump())
    await db.automation_rules.insert_one(rule_obj.model_dump())
    return rule_obj

@api_router.put("/automation/rules/{rule_id}/toggle")
async def toggle_automation_rule(rule_id: str):
    rule = await db.automation_rules.find_one({"id": rule_id}, {"_id": 0})
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    await db.automation_rules.update_one(
        {"id": rule_id},
        {"$set": {"enabled": not rule.get("enabled", True)}}
    )
    return {"message": "Rule toggled", "enabled": not rule.get("enabled", True)}

@api_router.delete("/automation/rules/{rule_id}")
async def delete_automation_rule(rule_id: str):
    result = await db.automation_rules.delete_one({"id": rule_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Rule not found")
    return {"message": "Rule deleted"}

# Automation V2 (Strategy/Code-based) Endpoints
@api_router.get("/automation/strategies", response_model=List[AutomationStrategy])
async def get_automation_strategies():
    strategies = await db.automation_strategies.find({}, {"_id": 0}).to_list(100)
    return strategies

@api_router.post("/automation/strategies", response_model=AutomationStrategy)
async def create_automation_strategy(strategy: AutomationStrategyCreate):
    strategy_obj = AutomationStrategy(**strategy.model_dump())
    await db.automation_strategies.insert_one(strategy_obj.model_dump())
    return strategy_obj

@api_router.put("/automation/strategies/{strategy_id}")
async def update_automation_strategy(strategy_id: str, strategy: AutomationStrategyCreate):
    result = await db.automation_strategies.update_one(
        {"id": strategy_id},
        {"$set": strategy.model_dump()}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Strategy not found")
    return {"message": "Strategy updated"}

@api_router.put("/automation/strategies/{strategy_id}/toggle")
async def toggle_automation_strategy(strategy_id: str):
    strategy = await db.automation_strategies.find_one({"id": strategy_id}, {"_id": 0})
    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found")
    await db.automation_strategies.update_one(
        {"id": strategy_id},
        {"$set": {"enabled": not strategy.get("enabled", False)}}
    )
    return {"message": "Strategy toggled", "enabled": not strategy.get("enabled", False)}

# Terminal Endpoint
@api_router.post("/terminal/execute")
async def execute_terminal_command(cmd: TerminalCommand):
    command = cmd.command.strip().lower()
    
    # Parse command
    if command.startswith("price "):
        symbol = command.replace("price ", "").upper()
        market_data = generate_mock_market_data()
        for item in market_data:
            if item.symbol.replace("/", "").lower() == symbol.replace("/", "").lower():
                return {"type": "price", "data": item.model_dump()}
        return {"type": "error", "message": f"Symbol {symbol} not found"}
    
    elif command == "regime":
        return {"type": "regime", "data": generate_mock_macro_data().model_dump()}
    
    elif command == "health":
        return {"type": "health", "data": [h.model_dump() for h in generate_mock_system_health()]}
    
    elif command == "alerts":
        alerts = await get_system_alerts()
        return {"type": "alerts", "data": alerts}
    
    elif command == "help":
        return {
            "type": "help",
            "commands": [
                {"cmd": "price <SYMBOL>", "desc": "Get current price for a symbol"},
                {"cmd": "regime", "desc": "Get current macro regime"},
                {"cmd": "health", "desc": "Get system health status"},
                {"cmd": "alerts", "desc": "Get active alerts"},
                {"cmd": "clear", "desc": "Clear terminal"},
                {"cmd": "help", "desc": "Show this help"},
            ]
        }
    
    elif command == "clear":
        return {"type": "clear"}
    
    else:
        return {"type": "error", "message": f"Unknown command: {command}. Type 'help' for available commands."}

# AI Assistant Endpoint
@api_router.post("/ai/query")
async def ai_query(query: AIQuery):
    try:
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            return {"error": "AI key not configured", "response": None}
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"quant-assistant-{uuid.uuid4()}",
            system_message="You are a senior quantitative analyst AI assistant. Provide concise, data-driven responses about markets, trading strategies, and risk management."
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        
        context_prompt = f"Context: {query.context}\n\n" if query.context else ""
        full_prompt = f"{context_prompt}User Query: {query.query}"
        
        response = await chat.send_message(UserMessage(text=full_prompt))
        return {"response": response, "query": query.query}
    except Exception as e:
        logging.error(f"AI query error: {e}")
        return {"error": str(e), "response": None}

# Dashboard Summary Endpoint
@api_router.get("/dashboard/summary")
async def get_dashboard_summary():
    market_data = generate_mock_market_data()
    regime_data = generate_mock_macro_data()
    health_data = generate_mock_system_health()
    
    pending_approvals = await db.approvals.count_documents({"status": "PENDING"})
    pending_research = await db.research_tasks.count_documents({"status": "PENDING"})
    active_rules = await db.automation_rules.count_documents({"enabled": True})
    
    total_pnl = sum([m.change for m in market_data])
    healthy_services = len([h for h in health_data if h.status == "HEALTHY"])
    
    return {
        "portfolio_value": round(random.uniform(10000000, 100000000), 2),
        "daily_pnl": round(total_pnl * 10000, 2),
        "daily_pnl_percent": round(total_pnl / len(market_data), 2),
        "open_positions": random.randint(15, 50),
        "current_regime": regime_data.current_regime,
        "regime_confidence": regime_data.confidence,
        "pending_approvals": pending_approvals,
        "pending_research": pending_research,
        "active_automations": active_rules,
        "system_health": f"{healthy_services}/{len(health_data)} Healthy",
        "top_movers": [{"symbol": m.symbol, "change_percent": m.change_percent} for m in sorted(market_data, key=lambda x: abs(x.change_percent), reverse=True)[:5]]
    }

# Hedge Fund Strategies Endpoints
@api_router.get("/strategies", response_model=List[HedgeFundStrategy])
async def get_all_strategies():
    return HEDGE_FUND_STRATEGIES

@api_router.get("/strategies/{strategy_id}", response_model=HedgeFundStrategy)
async def get_strategy(strategy_id: str):
    for strategy in HEDGE_FUND_STRATEGIES:
        if strategy.id == strategy_id:
            return strategy
    raise HTTPException(status_code=404, detail="Strategy not found")

@api_router.get("/strategies/category/{category}")
async def get_strategies_by_category(category: str):
    return [s for s in HEDGE_FUND_STRATEGIES if s.category.lower() == category.lower()]

@api_router.post("/strategies/{strategy_id}/analyze")
async def analyze_strategy(strategy_id: str):
    strategy = None
    for s in HEDGE_FUND_STRATEGIES:
        if s.id == strategy_id:
            strategy = s
            break
    
    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    try:
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            return {"error": "AI key not configured"}
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"strategy-analysis-{strategy_id}",
            system_message="You are a senior hedge fund strategist. Provide concise, actionable analysis on investment strategies."
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        
        prompt = f"""Analyze this hedge fund strategy for current market conditions (2026):

Strategy: {strategy.name}
Category: {strategy.category}
Description: {strategy.description}
Risk Level: {strategy.risk_level}
Expected Return: {strategy.expected_return}
Market Correlation: {strategy.correlation}
Key Factors: {', '.join(strategy.key_factors)}

Provide:
1. Current market outlook for this strategy (2-3 sentences)
2. Key opportunities (2 bullet points)
3. Primary risks to monitor (2 bullet points)
4. Recommended allocation weight (as percentage of portfolio)"""
        
        response = await chat.send_message(UserMessage(text=prompt))
        return {"strategy_id": strategy_id, "strategy_name": strategy.name, "analysis": response}
    except Exception as e:
        logging.error(f"Strategy analysis error: {e}")
        return {"strategy_id": strategy_id, "error": str(e)}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
