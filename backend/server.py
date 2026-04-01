from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import random
from emergentintegrations.llm.chat import LlmChat, UserMessage
import hashlib
import jwt
import yfinance as yf
import pandas as pd
from openclaw_service import OpenclawTradingAnalyzer
from hedge_funds_data import TOP_10_HEDGE_FUNDS
from paper_trading import (
    create_default_account, execute_market_order, 
    update_positions_prices, calculate_account_value, INITIAL_CAPITAL
)
from wellington_ai import get_wellington_ai
from uuid import uuid4

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Auth Configuration
SECRET_KEY = os.environ.get('JWT_SECRET', 'quantflow-private-dashboard-secret-key-2026')
OWNER_EMAIL = "barrientoswellingtonantonio@gmail.com"
# Password: 01230143NYSE@
OWNER_PASSWORD_HASH = os.environ.get('OWNER_PASSWORD_HASH', '363c4cf56d83a35e46db626240be1e94cdd179d90da2dabccff350b3bc8145ac')

# Initialize Openclaw AI Trading Analyzer
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', 'sk-emergent-fAc13EfFcA994F79cC')
openclaw_analyzer = OpenclawTradingAnalyzer(api_key=EMERGENT_LLM_KEY)

security = HTTPBearer(auto_error=False)

# Create the main app
app = FastAPI(title="QuantFlow Terminal API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ============== AUTH MODELS & FUNCTIONS ==============

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    token: str
    email: str
    message: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

def verify_password(password: str) -> bool:
    return hashlib.sha256(password.encode()).hexdigest() == OWNER_PASSWORD_HASH

def create_token(email: str) -> str:
    payload = {
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

def verify_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload.get("email")
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    email = verify_token(credentials.credentials)
    if not email or email != OWNER_EMAIL:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return email

# ============== AUTH ENDPOINTS ==============

@api_router.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    if request.email.lower() != OWNER_EMAIL.lower():
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(request.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(request.email)
    return LoginResponse(token=token, email=request.email, message="Login successful")

@api_router.get("/auth/verify")
async def verify_auth(current_user: str = Depends(get_current_user)):
    return {"authenticated": True, "email": current_user}

@api_router.post("/auth/change-password")
async def change_password(request: ChangePasswordRequest, current_user: str = Depends(get_current_user)):
    global OWNER_PASSWORD_HASH
    
    if not verify_password(request.current_password):
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    
    OWNER_PASSWORD_HASH = hashlib.sha256(request.new_password.encode()).hexdigest()
    return {"message": "Password changed successfully"}

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

# 13F SEC Filing Model
class SECFiling13F(BaseModel):
    id: str
    fund_name: str
    cik: str
    filing_date: str
    quarter: str
    aum: float
    top_holdings: List[Dict[str, Any]]
    sector_allocation: Dict[str, float]
    quarterly_change: float

# Global Index Model
class GlobalIndex(BaseModel):
    symbol: str
    name: str
    region: str
    value: float
    change: float
    change_percent: float
    ytd_percent: float

# Automation Module Models
class AutomationModule(BaseModel):
    id: str
    name: str
    category: str
    description: str
    status: str
    metrics: Dict[str, Any]
    last_run: Optional[str]
    alerts: List[str]

# 13F SEC Filing data is now imported from hedge_funds_data.py

# Mock Global Indices Data
def generate_global_indices():
    indices = [
        {"symbol": "SPX", "name": "S&P 500", "region": "US", "base": 5850},
        {"symbol": "DJI", "name": "Dow Jones", "region": "US", "base": 43200},
        {"symbol": "IXIC", "name": "NASDAQ", "region": "US", "base": 19800},
        {"symbol": "RUT", "name": "Russell 2000", "region": "US", "base": 2380},
        {"symbol": "FTSE", "name": "FTSE 100", "region": "UK", "base": 8250},
        {"symbol": "DAX", "name": "DAX 40", "region": "Germany", "base": 19500},
        {"symbol": "CAC", "name": "CAC 40", "region": "France", "base": 7650},
        {"symbol": "N225", "name": "Nikkei 225", "region": "Japan", "base": 39800},
        {"symbol": "HSI", "name": "Hang Seng", "region": "Hong Kong", "base": 19200},
        {"symbol": "SSEC", "name": "Shanghai Comp", "region": "China", "base": 3380},
        {"symbol": "SENSEX", "name": "BSE Sensex", "region": "India", "base": 81500},
        {"symbol": "ASX", "name": "ASX 200", "region": "Australia", "base": 8450},
        {"symbol": "TSX", "name": "TSX Composite", "region": "Canada", "base": 25200},
        {"symbol": "IBOV", "name": "Bovespa", "region": "Brazil", "base": 128500},
        {"symbol": "MOEX", "name": "MOEX Russia", "region": "Russia", "base": 2850},
        {"symbol": "KOSPI", "name": "KOSPI", "region": "South Korea", "base": 2520},
    ]
    result = []
    for idx in indices:
        change = random.uniform(-3, 3)
        result.append(GlobalIndex(
            symbol=idx["symbol"],
            name=idx["name"],
            region=idx["region"],
            value=round(idx["base"] * (1 + change/100), 2),
            change=round(idx["base"] * change/100, 2),
            change_percent=round(change, 2),
            ytd_percent=round(random.uniform(-5, 25), 2)
        ))
    return result

# Automation Modules Data
AUTOMATION_MODULES = [
    AutomationModule(
        id="trading-strategy",
        name="Automated Trading & Investment Strategy",
        category="CORE",
        description="Algorithms scan vast amounts of data to identify patterns, execute trades in milliseconds, and manage portfolio risk. Uses AI to analyze alternative data (satellite imagery, social media sentiment) to generate investment insights.",
        status="ACTIVE",
        metrics={"trades_today": 2847, "alpha_generated": 0.032, "latency_ms": 0.8, "data_sources": 156},
        last_run=datetime.now(timezone.utc).isoformat(),
        alerts=[]
    ),
    AutomationModule(
        id="research-aggregation",
        name="Research & Data Aggregation",
        category="DATA",
        description="Automation tools ingest, clean, and analyze market data from diverse sources (brokers, news feeds) in real-time, replacing manual data gathering.",
        status="ACTIVE",
        metrics={"feeds_active": 89, "events_processed": 15420, "latency_ms": 12, "accuracy": 99.7},
        last_run=datetime.now(timezone.utc).isoformat(),
        alerts=[]
    ),
    AutomationModule(
        id="compliance-risk",
        name="Compliance & Risk Management",
        category="RISK",
        description="Automated systems monitor trades against regulatory rules and pre-set risk limits (e.g., stopping trading if a 3% loss threshold is reached). Includes automated pre-trade checks and generating audit trails for regulators.",
        status="ACTIVE",
        metrics={"rules_checked": 342, "violations_blocked": 3, "var_utilization": 0.68, "audit_events": 8945},
        last_run=datetime.now(timezone.utc).isoformat(),
        alerts=["VaR approaching 70% threshold"]
    ),
    AutomationModule(
        id="middle-office",
        name="Operational & Middle Office Functions",
        category="OPS",
        description="RPA streamlines back-office processes like NAV (Net Asset Value) calculations, trade reconciliation, and investor reporting.",
        status="ACTIVE",
        metrics={"nav_calculated": True, "reconciliation_rate": 99.8, "pending_settlements": 12, "processed_today": 4521},
        last_run=datetime.now(timezone.utc).isoformat(),
        alerts=[]
    ),
    AutomationModule(
        id="investor-relations",
        name="Investor Relations & Reporting",
        category="IR",
        description="AI chatbots and automated workflows for generating personalized performance reports and summarizing investor communications.",
        status="ACTIVE",
        metrics={"reports_generated": 156, "queries_handled": 89, "satisfaction_score": 4.8, "response_time_min": 2.3},
        last_run=datetime.now(timezone.utc).isoformat(),
        alerts=[]
    )
]

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
    roi_data: Optional[Dict[str, Any]] = None  # ROI breakdown data

# Predefined Hedge Fund Strategies
HEDGE_FUND_STRATEGIES = [
    HedgeFundStrategy(
        id="composite-portfolio",
        name="Composite Portfolio Strategy",
        category="Multi-Strategy",
        description="A diversified master portfolio combining all 10 hedge fund strategies with optimized allocation weights. This composite approach provides comprehensive market exposure while balancing risk-return profiles across Equity, Macro, Credit, Quantitative, Arbitrage, Structured, Managed Futures, and Real Assets categories.",
        risk_level="MEDIUM",
        expected_return="9.2-14.8%",
        correlation="0.15-0.35",
        key_factors=["Diversification", "Risk Parity", "Multi-Asset Allocation", "Dynamic Rebalancing", "Correlation Management"],
        roi_data={
            "overall_roi": 11.5,
            "strategies": [
                {"id": "long-short-equity", "name": "Long/Short Equity", "allocation": 18, "roi": 12.3, "ytd": 8.7, "category": "Equity"},
                {"id": "global-macro", "name": "Global Macro", "allocation": 15, "roi": 14.8, "ytd": 11.2, "category": "Macro"},
                {"id": "event-driven-distressed", "name": "Event-Driven/Distressed", "allocation": 12, "roi": 15.2, "ytd": 9.8, "category": "Credit"},
                {"id": "quant-multi-strategy", "name": "Quant Multi-Strategy", "allocation": 14, "roi": 11.7, "ytd": 10.1, "category": "Quantitative"},
                {"id": "credit-risk-private", "name": "Credit Risk/Private Credit", "allocation": 10, "roi": 10.8, "ytd": 7.5, "category": "Credit"},
                {"id": "relative-value-arbitrage", "name": "Relative Value Arbitrage", "allocation": 8, "roi": 7.9, "ytd": 6.2, "category": "Arbitrage"},
                {"id": "ai-ml-trading", "name": "AI/ML Trading", "allocation": 12, "roi": 16.4, "ytd": 13.5, "category": "Quantitative"},
                {"id": "active-amcs", "name": "Active AMCs", "allocation": 6, "roi": 9.5, "ytd": 7.8, "category": "Structured"},
                {"id": "cta-trend-following", "name": "CTAs/Trend Following", "allocation": 8, "roi": 10.2, "ytd": 8.9, "category": "Managed Futures"},
                {"id": "inflation-hedged-real-assets", "name": "Inflation-Hedged Real Assets", "allocation": 7, "roi": 8.1, "ytd": 6.5, "category": "Real Assets"}
            ],
            "categories": [
                {"name": "Equity", "allocation": 18, "roi": 12.3, "risk": "MEDIUM", "strategies": 1},
                {"name": "Macro", "allocation": 15, "roi": 14.8, "risk": "HIGH", "strategies": 1},
                {"name": "Credit", "allocation": 22, "roi": 12.7, "risk": "MEDIUM-HIGH", "strategies": 2},
                {"name": "Quantitative", "allocation": 26, "roi": 13.9, "risk": "MEDIUM", "strategies": 2},
                {"name": "Arbitrage", "allocation": 8, "roi": 7.9, "risk": "LOW-MEDIUM", "strategies": 1},
                {"name": "Structured", "allocation": 6, "roi": 9.5, "risk": "MEDIUM", "strategies": 1},
                {"name": "Managed Futures", "allocation": 8, "roi": 10.2, "risk": "MEDIUM-HIGH", "strategies": 1},
                {"name": "Real Assets", "allocation": 7, "roi": 8.1, "risk": "LOW-MEDIUM", "strategies": 1}
            ]
        }
    ),
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

# ============== REAL-TIME FINANCIAL DATA FUNCTIONS ==============

def get_real_market_data():
    """Fetch real-time market data from Yahoo Finance"""
    symbols_map = {
        "BTC-USD": "BTC/USD",
        "ETH-USD": "ETH/USD", 
        "SPY": "SPY",
        "QQQ": "QQQ",
        "AAPL": "AAPL",
        "MSFT": "MSFT",
        "GOOGL": "GOOGL",
        "NVDA": "NVDA",
        "TSLA": "TSLA",
        "GLD": "GLD"
    }
    
    data = []
    try:
        for yf_symbol, display_symbol in symbols_map.items():
            try:
                ticker = yf.Ticker(yf_symbol)
                info = ticker.info
                
                current_price = info.get('regularMarketPrice') or info.get('currentPrice') or 0
                previous_close = info.get('previousClose') or info.get('regularMarketPreviousClose') or current_price
                
                change = current_price - previous_close
                change_percent = (change / previous_close * 100) if previous_close > 0 else 0
                volume = info.get('volume') or info.get('regularMarketVolume') or 0
                
                data.append(MarketData(
                    symbol=display_symbol,
                    price=round(current_price, 2),
                    change=round(change, 2),
                    change_percent=round(change_percent, 2),
                    volume=volume,
                    timestamp=datetime.now(timezone.utc).isoformat()
                ))
            except Exception as e:
                logging.warning(f"Failed to fetch {yf_symbol}: {e}")
                continue
                
        # If we got no data, return minimal fallback
        if not data:
            raise Exception("No data fetched")
            
    except Exception as e:
        logging.error(f"Yahoo Finance data fetch failed: {e}")
        # Fallback to mock data if API fails
        return generate_mock_market_data()
    
    return data

def get_real_chart_data(symbol: str, period: str = "1D"):
    """Fetch real-time chart data from Yahoo Finance"""
    try:
        # Map display symbol to Yahoo Finance symbol
        symbol_map = {
            "BTC/USD": "BTC-USD",
            "ETH/USD": "ETH-USD",
            "SPY": "SPY", "QQQ": "QQQ", "AAPL": "AAPL",
            "MSFT": "MSFT", "GOOGL": "GOOGL", "NVDA": "NVDA",
            "TSLA": "TSLA", "GLD": "GLD"
        }
        
        yf_symbol = symbol_map.get(symbol, symbol)
        ticker = yf.Ticker(yf_symbol)
        
        # Map period to yfinance parameters
        period_map = {
            "1D": ("1d", "5m"),
            "1W": ("5d", "30m"),
            "1M": ("1mo", "1d"),
            "3M": ("3mo", "1d"),
            "1Y": ("1y", "1d"),
        }
        
        yf_period, interval = period_map.get(period, ("1d", "5m"))
        hist = ticker.history(period=yf_period, interval=interval)
        
        if hist.empty:
            raise Exception("No historical data available")
        
        # Convert to format expected by frontend
        chart_data = []
        for timestamp, row in hist.iterrows():
            chart_data.append({
                "timestamp": timestamp.isoformat(),
                "open": round(float(row['Open']), 2),
                "high": round(float(row['High']), 2),
                "low": round(float(row['Low']), 2),
                "close": round(float(row['Close']), 2),
                "volume": int(row['Volume'])
            })
        
        return chart_data
        
    except Exception as e:
        logging.error(f"Chart data fetch failed for {symbol}: {e}")
        # Fallback to mock data
        return generate_mock_chart_data(period)

def generate_mock_chart_data(period: str):
    """Fallback mock chart data"""
    data_points = {"1D": 24, "1W": 168, "1M": 720, "3M": 2160, "1Y": 365}
    num_points = data_points.get(period, 24)
    base_price = random.uniform(100, 500)
    data = []
    for i in range(num_points):
        volatility = base_price * 0.02
        price = base_price + random.uniform(-volatility, volatility)
        data.append({
            "timestamp": (datetime.now(timezone.utc) - timedelta(hours=num_points-i)).isoformat(),
            "open": round(price, 2),
            "high": round(price * 1.01, 2),
            "low": round(price * 0.99, 2),
            "close": round(price * random.uniform(0.995, 1.005), 2),
            "volume": random.randint(100000, 10000000)
        })
    return data

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
    """Get real-time market data from Yahoo Finance"""
    return get_real_market_data()

@api_router.get("/market/chart/{symbol:path}")
async def get_chart_data(symbol: str, period: str = "1D"):
    """Get real-time chart data from Yahoo Finance"""
    chart_data = get_real_chart_data(symbol, period)
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
    """Advanced AI strategy analysis using Openclaw autonomous system"""
    strategy = next((s for s in HEDGE_FUND_STRATEGIES if s.id == strategy_id), None)
    
    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    try:
        # Use Openclaw AI for advanced autonomous analysis
        analysis = await openclaw_analyzer.analyze_strategy(
            strategy.model_dump()
        )
        
        return {
            "strategy_id": strategy_id,
            "strategy_name": strategy.name,
            "analysis": analysis,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "system": "AI Trading Optimization System"  # No Openclaw branding
        }
    except Exception as e:
        logging.error(f"AI analysis error: {e}")
        return {"strategy_id": strategy_id, "error": str(e)}

@api_router.post("/strategies/composite/optimize")
async def optimize_composite_portfolio():
    """Autonomous portfolio optimization using Openclaw AI"""
    try:
        strategies_data = [s.model_dump() for s in HEDGE_FUND_STRATEGIES]
        
        optimization = await openclaw_analyzer.optimize_composite_portfolio(strategies_data)
        
        return {
            "optimization": optimization,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "system": "AI Portfolio Optimization System",
            "strategies_analyzed": len(HEDGE_FUND_STRATEGIES)
        }
    except Exception as e:
        logging.error(f"Portfolio optimization error: {e}")
        return {"error": str(e)}

# 13F SEC Filings Endpoints
@api_router.get("/sec/13f")
async def get_13f_filings():
    """Get all 10 hedge fund 13F filings with 50 holdings each"""
    return TOP_10_HEDGE_FUNDS

@api_router.get("/sec/13f/{fund_id}")
async def get_13f_filing(fund_id: str):
    """Get detailed 13F filing for a specific hedge fund"""
    for filing in TOP_10_HEDGE_FUNDS:
        if filing["id"] == fund_id:
            return filing
    raise HTTPException(status_code=404, detail="Filing not found")

@api_router.post("/sec/13f/{fund_id}/analyze")
async def analyze_13f_filing(fund_id: str):
    """Analyze a single fund's 13F filing"""
    filing = None
    for f in TOP_10_HEDGE_FUNDS:
        if f["id"] == fund_id:
            filing = f
            break
    
    if not filing:
        raise HTTPException(status_code=404, detail="Filing not found")
    
    try:
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            return {"error": "AI key not configured"}
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"13f-analysis-{fund_id}",
            system_message="You are a senior hedge fund analyst specializing in 13F SEC filings analysis. Provide concise, actionable insights."
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        
        # Use top 10 holdings for analysis (not all 50 to keep prompt manageable)
        holdings_str = "\n".join([f"- {h['symbol']}: ${h['value']/1e9:.2f}B ({h['percent']}%)" for h in filing["top_holdings"][:10]])
        sector_str = "\n".join([f"- {k}: {v}%" for k, v in filing["sector_allocation"].items()])
        
        prompt = f"""Analyze this 13F SEC filing for {filing["fund_name"]}:

Fund: {filing["fund_name"]}
AUM: ${filing["aum"]/1e9:.1f} Billion
Quarter: {filing["quarter"]}
Quarterly Change: {filing["quarterly_change"]}%

Top 10 Holdings:
{holdings_str}

Sector Allocation:
{sector_str}

Provide:
1. Investment thesis summary (what is this fund betting on?)
2. Key sector bets and their rationale
3. Notable position changes to watch
4. Potential signals for retail investors
5. Risk factors in their portfolio

Keep the analysis concise and under 300 words."""
        
        response = await chat.send_message(UserMessage(text=prompt))
        
        return {"analysis": response}
        
    except Exception as e:
        logging.error(f"Error analyzing 13F: {e}")
        return {"error": str(e)}

@api_router.post("/sec/13f/analyze-all")
async def analyze_all_13f_filings():
    """Analyze all 10 hedge fund 13F filings together - comparative analysis"""
    try:
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            return {"error": "AI key not configured"}
        
        chat = LlmChat(
            api_key=api_key,
            session_id="13f-analysis-all-funds",
            system_message="You are a senior hedge fund analyst specializing in comparative 13F SEC filings analysis across multiple top hedge funds. Identify trends, consensus bets, and divergences."
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        
        # Build comprehensive overview of all 10 funds
        funds_overview = []
        for fund in TOP_10_HEDGE_FUNDS:
            top_5_holdings = "\n  ".join([f"{h['symbol']}: {h['percent']}%" for h in fund["top_holdings"][:5]])
            funds_overview.append(f"""
**{fund["fund_name"]}** (AUM: ${fund["aum"]/1e9:.1f}B, QoQ: {fund["quarterly_change"]}%)
Top 5 Holdings:
  {top_5_holdings}
Sector Focus: {', '.join([f"{k}: {v}%" for k, v in sorted(fund["sector_allocation"].items(), key=lambda x: x[1], reverse=True)[:3]])}
""")
        
        funds_summary = "\n".join(funds_overview)
        
        prompt = f"""Analyze these Top 10 Hedge Funds' Q3 2025 13F SEC Filings:

{funds_summary}

Provide a comprehensive comparative analysis covering:

1. **Consensus Bets**: Which stocks/sectors are multiple top funds piling into? What does this signal?

2. **Divergent Strategies**: Which funds are zigging while others zag? Highlight contrarian positions.

3. **Sector Trends**: What are the dominant sector allocations? Is there a shift from previous quarters?

4. **Tech vs Traditional**: How are funds positioned between growth tech and value/defensive sectors?

5. **Risk Assessment**: Which funds have concentrated vs diversified portfolios? What are the tail risks?

6. **Retail Investor Takeaways**: What actionable insights can individual investors glean from these institutional moves?

7. **Market Outlook Signals**: What do these collective positions suggest about institutional sentiment for 2026?

Keep the analysis comprehensive but concise (under 600 words). Use clear sections and bullet points where appropriate."""
        
        response = await chat.send_message(UserMessage(text=prompt))
        
        return {"analysis": response, "funds_analyzed": len(TOP_10_HEDGE_FUNDS)}
        
    except Exception as e:
        logging.error(f"Error analyzing all 13F filings: {e}")
        return {"error": str(e)}

# ============== PAPER TRADING ENDPOINTS ==============

@api_router.get("/paper-trading/account")
async def get_paper_account(user: dict = Depends(verify_token)):
    """Get or create user's paper trading account"""
    user_id = user["email"]
    
    account = await db.paper_accounts.find_one({"user_id": user_id}, {"_id": 0})
    
    if not account:
        account = create_default_account(user_id)
        await db.paper_accounts.insert_one(account)
    
    if account["positions"]:
        symbols = [p["symbol"] for p in account["positions"]]
        price_data = {}
        for symbol in symbols:
            try:
                ticker = yf.Ticker(symbol)
                hist = ticker.history(period="1d")
                if not hist.empty:
                    price_data[symbol] = float(hist['Close'].iloc[-1])
            except:
                pass
        
        account["positions"] = update_positions_prices(account["positions"], price_data)
        total_value, total_pl = calculate_account_value(account["positions"], account["cash_balance"])
        account["total_value"] = total_value
        account["total_pl"] = total_pl
        account["total_pl_percent"] = (total_pl / INITIAL_CAPITAL) * 100
        account["buying_power"] = account["cash_balance"]
    
    return account

@api_router.get("/paper-trading/watchlist")
async def get_paper_watchlist():
    """Get the 50-item watchlist: top 5 from each of 10 hedge funds"""
    watchlist = []
    position = 1
    
    for fund in TOP_10_HEDGE_FUNDS:
        top_5 = fund["top_holdings"][:5]
        for holding in top_5:
            watchlist.append({
                "position": position,
                "symbol": holding["symbol"],
                "name": holding["name"],
                "hedge_fund": fund["fund_name"],
                "weight": holding["percent"],
                "current_price": 0,
                "change": holding["change"],
                "value": holding["value"]
            })
            position += 1
    
    for item in watchlist:
        try:
            ticker = yf.Ticker(item["symbol"])
            hist = ticker.history(period="1d")
            if not hist.empty:
                item["current_price"] = float(hist['Close'].iloc[-1])
        except:
            item["current_price"] = 0
    
    return watchlist

class PlaceOrderRequest(BaseModel):
    symbol: str
    name: str
    order_type: str
    side: str
    quantity: int
    price: Optional[float] = None
    hedge_fund: str

@api_router.post("/paper-trading/order")
async def place_order(order_req: PlaceOrderRequest, user: dict = Depends(verify_token)):
    """Place a paper trading order (Market or Limit)"""
    user_id = user["email"]
    
    account = await db.paper_accounts.find_one({"user_id": user_id}, {"_id": 0})
    if not account:
        account = create_default_account(user_id)
        await db.paper_accounts.insert_one(account)
    
    order = {
        "order_id": str(uuid4()),
        "symbol": order_req.symbol,
        "name": order_req.name,
        "order_type": order_req.order_type,
        "side": order_req.side,
        "quantity": order_req.quantity,
        "price": order_req.price,
        "status": "PENDING",
        "filled_price": None,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "hedge_fund": order_req.hedge_fund
    }
    
    try:
        ticker = yf.Ticker(order_req.symbol)
        hist = ticker.history(period="1d")
        if hist.empty:
            raise HTTPException(status_code=400, detail="Unable to fetch current price")
        current_price = float(hist['Close'].iloc[-1])
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error fetching price: {str(e)}")
    
    if order_req.order_type == "MARKET":
        try:
            account = execute_market_order(account, order, current_price)
            await db.paper_accounts.update_one({"user_id": user_id}, {"$set": account})
            return {"status": "success", "message": "Market order executed", "order": order}
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    elif order_req.order_type == "LIMIT":
        if order_req.side == "BUY" and current_price <= order_req.price:
            account = execute_market_order(account, order, current_price)
            await db.paper_accounts.update_one({"user_id": user_id}, {"$set": account})
            return {"status": "success", "message": "Limit order filled immediately", "order": order}
        elif order_req.side == "SELL" and current_price >= order_req.price:
            account = execute_market_order(account, order, current_price)
            await db.paper_accounts.update_one({"user_id": user_id}, {"$set": account})
            return {"status": "success", "message": "Limit order filled immediately", "order": order}
        else:
            order["status"] = "PENDING"
            account["order_history"].append(order)
            await db.paper_accounts.update_one({"user_id": user_id}, {"$set": account})
            return {"status": "pending", "message": "Limit order placed, waiting for price", "order": order}

@api_router.post("/paper-trading/reset")
async def reset_paper_account(user: dict = Depends(verify_token)):
    """Reset paper trading account back to $100M"""
    user_id = user["email"]
    
    new_account = create_default_account(user_id)
    
    await db.paper_accounts.update_one(
        {"user_id": user_id},
        {"$set": new_account},
        upsert=True
    )
    
    return {"status": "success", "message": "Account reset to $100,000,000", "account": new_account}

# ============== WELLINGTON AI ENDPOINTS ==============

class WellingtonChatRequest(BaseModel):
    message: str
    include_context: bool = True

@api_router.post("/wellington/chat")
async def chat_with_wellington(request: WellingtonChatRequest, user: dict = Depends(verify_token)):
    """Chat with Wellington AI"""
    try:
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            return {"error": "AI key not configured"}
        
        wellington = get_wellington_ai(api_key)
        
        # Get context if requested
        context = {}
        if request.include_context:
            user_id = user["email"]
            account = await db.paper_accounts.find_one({"user_id": user_id}, {"_id": 0})
            if account:
                context = {
                    "account_value": account.get("total_value", 0),
                    "positions_count": len(account.get("positions", [])),
                    "success_rate": 0,  # Will be calculated from trading history
                    "recent_insights": []
                }
        
        response = await wellington.chat_with_wellington(request.message, context)
        
        return {"response": response, "timestamp": datetime.now(timezone.utc).isoformat()}
    except Exception as e:
        logging.error(f"Wellington chat error: {e}")
        return {"error": str(e)}

@api_router.post("/wellington/analyze")
async def wellington_analyze_watchlist(user: dict = Depends(verify_token)):
    """Have Wellington AI analyze the watchlist and provide recommendations"""
    try:
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            return {"error": "AI key not configured"}
        
        wellington = get_wellington_ai(api_key)
        
        # Get watchlist
        watchlist = []
        position = 1
        for fund in TOP_10_HEDGE_FUNDS:
            top_5 = fund["top_holdings"][:5]
            for holding in top_5:
                ticker = yf.Ticker(holding["symbol"])
                hist = ticker.history(period="1d")
                current_price = float(hist['Close'].iloc[-1]) if not hist.empty else 0
                
                watchlist.append({
                    "position": position,
                    "symbol": holding["symbol"],
                    "name": holding["name"],
                    "hedge_fund": fund["fund_name"],
                    "weight": holding["percent"],
                    "current_price": current_price,
                    "change": holding["change"]
                })
                position += 1
        
        # Get account data
        user_id = user["email"]
        account = await db.paper_accounts.find_one({"user_id": user_id}, {"_id": 0})
        if not account:
            account = create_default_account(user_id)
        
        # Analyze
        analysis = await wellington.analyze_watchlist(watchlist, account)
        
        return analysis
    except Exception as e:
        logging.error(f"Wellington analysis error: {e}")
        return {"error": str(e)}

@api_router.post("/wellington/auto-trade")
async def wellington_auto_trade(user: dict = Depends(verify_token)):
    """Execute autonomous trading with $500 allocation"""
    try:
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            return {"error": "AI key not configured"}
        
        wellington = get_wellington_ai(api_key)
        
        # Get analysis first
        user_id = user["email"]
        account = await db.paper_accounts.find_one({"user_id": user_id}, {"_id": 0})
        if not account:
            account = create_default_account(user_id)
            await db.paper_accounts.insert_one(account)
        
        # Get watchlist with prices
        watchlist = []
        for fund in TOP_10_HEDGE_FUNDS:
            for holding in fund["top_holdings"][:5]:
                ticker = yf.Ticker(holding["symbol"])
                hist = ticker.history(period="1d")
                current_price = float(hist['Close'].iloc[-1]) if not hist.empty else 0
                
                watchlist.append({
                    "position": len(watchlist) + 1,
                    "symbol": holding["symbol"],
                    "name": holding["name"],
                    "hedge_fund": fund["fund_name"],
                    "current_price": current_price,
                    "change": holding["change"]
                })
        
        # Get AI recommendations
        analysis = await wellington.analyze_watchlist(watchlist, account)
        
        if "error" in analysis or not analysis.get("recommendations"):
            return {"error": "No recommendations generated", "analysis": analysis}
        
        # Execute top recommendation if confidence > 6
        executed_trades = []
        for rec in analysis["recommendations"][:3]:  # Top 3 recommendations
            if rec.get("confidence", 0) >= 6:
                # Find stock in watchlist
                stock = next((s for s in watchlist if s["symbol"] == rec["symbol"]), None)
                if stock and stock["current_price"] > 0:
                    # Execute trade
                    trade = await wellington.execute_autonomous_trade(rec, stock["current_price"])
                    
                    # Place order in paper trading
                    order = {
                        "order_id": str(uuid4()),
                        "symbol": trade["symbol"],
                        "name": stock["name"],
                        "order_type": "MARKET",
                        "side": trade["action"],
                        "quantity": trade["quantity"],
                        "price": None,
                        "status": "PENDING",
                        "filled_price": None,
                        "timestamp": trade["timestamp"],
                        "hedge_fund": stock["hedge_fund"],
                        "wellington_ai": True,
                        "confidence": trade["confidence"]
                    }
                    
                    account = execute_market_order(account, order, stock["current_price"])
                    executed_trades.append(trade)
        
        # Update account
        await db.paper_accounts.update_one({"user_id": user_id}, {"$set": account})
        
        return {
            "status": "success",
            "trades_executed": len(executed_trades),
            "trades": executed_trades,
            "analysis": analysis
        }
        
    except Exception as e:
        logging.error(f"Wellington auto-trade error: {e}")
        return {"error": str(e)}

@api_router.get("/wellington/performance")
async def wellington_get_performance():
    """Get Wellington AI performance metrics"""
    try:
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        wellington = get_wellington_ai(api_key)
        return wellington.get_performance_summary()
    except Exception as e:
        return {"error": str(e)}

# Global Indices / Heat Map Endpoints
@api_router.get("/market/indices")
async def get_global_indices():
    return [idx.model_dump() for idx in generate_global_indices()]

@api_router.get("/market/heatmap")
async def get_market_heatmap():
    indices = generate_global_indices()
    regions = {}
    for idx in indices:
        if idx.region not in regions:
            regions[idx.region] = []
        regions[idx.region].append({
            "symbol": idx.symbol,
            "name": idx.name,
            "change_percent": idx.change_percent,
            "ytd_percent": idx.ytd_percent
        })
    return {"regions": regions, "timestamp": datetime.now(timezone.utc).isoformat()}

# Automation Hub Endpoints
@api_router.get("/automation/modules")
async def get_automation_modules():
    return [m.model_dump() for m in AUTOMATION_MODULES]

@api_router.get("/automation/modules/{module_id}")
async def get_automation_module(module_id: str):
    for module in AUTOMATION_MODULES:
        if module.id == module_id:
            return module.model_dump()
    raise HTTPException(status_code=404, detail="Module not found")

@api_router.post("/automation/modules/{module_id}/analyze")
async def analyze_automation_module(module_id: str):
    module = None
    for m in AUTOMATION_MODULES:
        if m.id == module_id:
            module = m
            break
    
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    try:
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            return {"error": "AI key not configured"}
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"automation-analysis-{module_id}",
            system_message="You are a hedge fund operations expert specializing in automation and technology. Provide optimization recommendations."
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        
        metrics_str = "\n".join([f"- {k}: {v}" for k, v in module.metrics.items()])
        
        prompt = f"""Analyze this automation module and provide optimization recommendations:

Module: {module.name}
Category: {module.category}
Description: {module.description}
Status: {module.status}

Current Metrics:
{metrics_str}

Active Alerts: {', '.join(module.alerts) if module.alerts else 'None'}

Provide:
1. Performance assessment (is this module performing optimally?)
2. Top 3 optimization recommendations
3. Potential risks or bottlenecks
4. Industry benchmarks comparison
5. Next steps for improvement"""
        
        response = await chat.send_message(UserMessage(text=prompt))
        return {"module_id": module_id, "module_name": module.name, "analysis": response}
    except Exception as e:
        logging.error(f"Automation analysis error: {e}")
        return {"module_id": module_id, "error": str(e)}

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


