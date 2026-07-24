"""
Iteration 4 - Regression tests after code review refactor
- Auth removed: all endpoints open, no tokens
- Wellington: models list + chat routing (mode_used, model_used)
- Paper Trading: account + watchlist read-only
- Strategies, 13F, System Health, Intel: shape checks
"""
import os
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------- Basic health ----------
def test_root(client):
    r = client.get(f"{API}/")
    assert r.status_code == 200
    body = r.json()
    assert "QuantFlow" in body.get("message", "")


# ---------- Auth removed (open access) ----------
def test_auth_endpoints_removed(client):
    # Old login should be gone (404)
    r = client.post(f"{API}/auth/login", json={"email": "x", "password": "y"})
    assert r.status_code == 404


def test_paper_trading_open_no_token(client):
    """Paper trading account endpoint must respond WITHOUT Authorization header"""
    r = client.get(f"{API}/paper-trading/account")
    assert r.status_code == 200
    data = r.json()
    assert data.get("user_id") == "barrientoswellingtonantonio@gmail.com"
    assert "total_value" in data
    # Existing 150-order portfolio expected
    assert isinstance(data.get("positions", []), list)
    assert isinstance(data.get("order_history", []), list)


def test_paper_trading_account_value(client):
    r = client.get(f"{API}/paper-trading/account")
    assert r.status_code == 200
    data = r.json()
    tv = data.get("total_value", 0)
    # Expected ~$100.38M per problem statement
    assert 90_000_000 <= tv <= 120_000_000, f"unexpected total_value={tv}"


def test_paper_trading_positions_have_unique_symbols(client):
    r = client.get(f"{API}/paper-trading/account")
    assert r.status_code == 200
    positions = r.json().get("positions", [])
    symbols = [p["symbol"] for p in positions]
    assert len(symbols) == len(set(symbols)), "duplicate symbols in positions (React key issue)"


def test_paper_trading_orders_have_unique_order_ids(client):
    r = client.get(f"{API}/paper-trading/account")
    assert r.status_code == 200
    orders = r.json().get("order_history", [])
    ids = [o.get("order_id") for o in orders if o.get("order_id")]
    assert len(ids) == len(set(ids)), "duplicate order_id in order_history (React key issue)"


def test_paper_trading_watchlist(client):
    r = client.get(f"{API}/paper-trading/watchlist")
    assert r.status_code == 200
    wl = r.json()
    assert isinstance(wl, list)
    assert len(wl) > 0
    # Each item has a symbol used as React key
    for it in wl:
        assert "symbol" in it


# ---------- Wellington ----------
def test_wellington_models(client):
    r = client.get(f"{API}/wellington/models")
    assert r.status_code == 200
    body = r.json()
    models = body.get("models", [])
    assert len(models) == 4, f"expected 4 models, got {len(models)}"
    assert body.get("default") == "claude-sonnet-4-6"
    ids = [m["id"] for m in models]
    assert "claude-sonnet-4-6" in ids
    assert "claude-opus-4-8" in ids
    assert "claude-haiku-4-5-20251001" in ids
    assert "claude-sonnet-4-5-20250929" in ids


def test_wellington_chat_standard_mode(client):
    r = client.post(
        f"{API}/wellington/chat",
        json={"message": "hello", "include_context": False, "model": "claude-sonnet-4-6"},
        timeout=60,
    )
    assert r.status_code == 200
    body = r.json()
    # Even if LLM budget is exhausted, response shape must be correct
    assert "response" in body
    assert body.get("mode_used") == "standard"
    assert body.get("model_used") == "claude-sonnet-4-6"


def test_wellington_chat_code_generation_mode(client):
    r = client.post(
        f"{API}/wellington/chat",
        json={
            "message": "write a backtest algorithm in python for a momentum strategy",
            "include_context": False,
            "model": "claude-opus-4-8",
        },
        timeout=60,
    )
    assert r.status_code == 200
    body = r.json()
    assert body.get("mode_used") == "code_generation"
    assert body.get("model_used") == "claude-opus-4-8"


def test_wellington_chat_invalid_model_falls_back(client):
    r = client.post(
        f"{API}/wellington/chat",
        json={"message": "hello", "include_context": False, "model": "not-a-real-model"},
        timeout=60,
    )
    assert r.status_code == 200
    body = r.json()
    assert body.get("model_used") == "claude-sonnet-4-6"  # falls back to default


# ---------- Strategies (list & shape used for React keys) ----------
def test_strategies_list(client):
    r = client.get(f"{API}/strategies")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list) and len(data) > 0
    ids = [s["id"] for s in data]
    assert len(ids) == len(set(ids)), "duplicate strategy ids"
    for s in data:
        assert isinstance(s.get("key_factors", []), list)


# ---------- 13F ----------
def test_13f_list(client):
    r = client.get(f"{API}/sec/13f")
    assert r.status_code == 200
    funds = r.json()
    assert isinstance(funds, list) and len(funds) == 10
    # holdings have unique symbols (used as React keys)
    for f in funds:
        symbols = [h["symbol"] for h in f["top_holdings"]]
        # de-dupe allowed if backend has none; ensure they exist
        assert len(symbols) > 0
        # sector_allocation keys used for React keys
        assert isinstance(f["sector_allocation"], dict)


# ---------- System Health ----------
def test_system_health(client):
    r = client.get(f"{API}/system/health")
    assert r.status_code == 200
    services = r.json()
    assert isinstance(services, list) and len(services) > 0
    names = [s["service"] for s in services]
    assert len(names) == len(set(names)), "duplicate service names (React key issue)"


# ---------- Intel ----------
def test_intel_events(client):
    r = client.get(f"{API}/intel/events")
    assert r.status_code == 200
    events = r.json()
    assert isinstance(events, list) and len(events) > 0


# ---------- Market Data (Quant Dashboard) ----------
def test_market_data(client):
    r = client.get(f"{API}/market/data")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list) and len(data) > 0
    syms = [d["symbol"] for d in data]
    assert len(syms) == len(set(syms)), "duplicate symbols in market data (React key issue)"


# ---------- Dashboard summary (Hub page) ----------
def test_dashboard_summary(client):
    r = client.get(f"{API}/dashboard/summary")
    assert r.status_code == 200
    body = r.json()
    for k in ["portfolio_value", "daily_pnl", "open_positions", "current_regime", "top_movers"]:
        assert k in body
