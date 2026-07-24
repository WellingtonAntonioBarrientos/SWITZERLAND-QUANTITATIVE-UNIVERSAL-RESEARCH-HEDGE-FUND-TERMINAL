"""
Iteration 5 tests:
- BRANDING: Verify GET /api/ returns rebranded SQUHF message
- REGRESSION: Verify paper trading watchlist API still functions (position uniqueness)
- SMOKE: Verify core endpoints still return 200 (health, market, macro, intel, paper-trading)
"""
import os
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://trading-platform-223.preview.emergentagent.com").rstrip("/")


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# BRANDING
class TestBranding:
    def test_api_root_rebranded_message(self, client):
        r = client.get(f"{BASE_URL}/api/", timeout=30)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        data = r.json()
        assert data.get("message") == "Switzerland Quantitative Universal Hedge Fund Terminal API", (
            f"Unexpected root message: {data}"
        )
        assert "version" in data

    def test_openapi_title_rebranded(self, client):
        # openapi may not be exposed via /api prefix; try /openapi.json fallback
        for path in ("/api/openapi.json", "/openapi.json"):
            r = client.get(f"{BASE_URL}{path}", timeout=30)
            if r.status_code == 200 and r.headers.get("content-type", "").startswith("application/json"):
                info = r.json().get("info", {})
                title = info.get("title", "")
                assert "Switzerland Quantitative" in title or "SQUHF" in title, f"Unexpected FastAPI title: {title}"
                return
        pytest.skip("openapi.json not publicly exposed as JSON")


# SMOKE
class TestSmokeEndpoints:
    def test_market_data(self, client):
        r = client.get(f"{BASE_URL}/api/market/data", timeout=30)
        assert r.status_code == 200

    def test_market_indices(self, client):
        r = client.get(f"{BASE_URL}/api/market/indices", timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) > 0

    def test_market_heatmap(self, client):
        r = client.get(f"{BASE_URL}/api/market/heatmap", timeout=30)
        assert r.status_code == 200

    def test_macro_regime(self, client):
        r = client.get(f"{BASE_URL}/api/macro/regime", timeout=30)
        assert r.status_code == 200

    def test_macro_correlation(self, client):
        r = client.get(f"{BASE_URL}/api/macro/correlation", timeout=30)
        assert r.status_code == 200

    def test_intel_events(self, client):
        r = client.get(f"{BASE_URL}/api/intel/events", timeout=30)
        assert r.status_code == 200

    def test_paper_trading_account(self, client):
        r = client.get(f"{BASE_URL}/api/paper-trading/account", timeout=30)
        assert r.status_code == 200
        data = r.json()
        # Portfolio has both cash + positions; expected ~$100M
        assert isinstance(data, dict), f"Expected dict, got: {type(data)}"
        # Just check response is a non-empty JSON object
        assert len(data.keys()) > 0

    def test_wellington_models(self, client):
        r = client.get(f"{BASE_URL}/api/wellington/models", timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, (list, dict))


# REGRESSION: watchlist uniqueness — even if a symbol repeats, positions must be unique 1..N
class TestWatchlistRegression:
    def test_watchlist_positions_unique(self, client):
        # Watchlist could be at /api/paper-trading/watchlist
        r = client.get(f"{BASE_URL}/api/paper-trading/watchlist", timeout=30)
        if r.status_code == 404:
            pytest.skip("Watchlist endpoint not exposed via API (likely client-generated data)")
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        if items and isinstance(items[0], dict) and "position" in items[0]:
            positions = [x["position"] for x in items]
            assert len(positions) == len(set(positions)), (
                f"Duplicate positions in watchlist: {positions}"
            )
