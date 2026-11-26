"""
Iteration 6 - Security fixes verification (SEC-001 SSRF, SEC-002 secret,
SEC-003 rate limit + reset confirmation, SEC-004 upload cap, error disclosure)
plus regression on core read endpoints.
"""
import os
import io
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://trading-platform-223.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


# ---------- SEC-002 boot & regression: root + models ----------
def test_root_ok():
    r = requests.get(f"{API}/", timeout=15)
    assert r.status_code == 200
    body = r.json()
    assert "message" in body
    assert "version" in body


def test_wellington_models_returns_4_claude():
    r = requests.get(f"{API}/wellington/models", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert "models" in data and "default" in data
    assert len(data["models"]) == 8  # iteration7: 4 Claude + 4 GPT


# ---------- SEC-001 SSRF blocks ----------
@pytest.mark.parametrize("bad_url", [
    "http://169.254.169.254/",
    "http://localhost:8001/",
    "http://127.0.0.1/",
    "ftp://example.com",
])
def test_ssrf_blocks_disallowed_urls(bad_url):
    r = requests.post(f"{API}/wellington/analyze-url", data={"url": bad_url}, timeout=15)
    assert r.status_code == 400, f"Expected 400 for {bad_url}, got {r.status_code}: {r.text[:200]}"
    # Error must be generic, not stacktrace
    body = r.json()
    detail = str(body.get("detail", ""))
    assert "Traceback" not in detail
    assert "http" in detail.lower() or "url" in detail.lower() or "address" in detail.lower() or "resolve" in detail.lower()


def test_ssrf_allows_public_url():
    """Public URL must NOT return 400 (SSRF block). Any other status (200/413/500-ish
    generic error string) is acceptable because LLM budget may be exhausted."""
    r = requests.post(f"{API}/wellington/analyze-url", data={"url": "https://example.com"}, timeout=25)
    assert r.status_code != 400, f"Public URL was blocked as SSRF: {r.status_code} {r.text[:200]}"


# ---------- SEC-004 upload size cap ----------
def test_upload_image_over_10mb_returns_413():
    big = b"x" * (10 * 1024 * 1024 + 1024)
    r = requests.post(
        f"{API}/wellington/upload-image",
        files={"file": ("big.bin", io.BytesIO(big), "application/octet-stream")},
        timeout=60,
    )
    assert r.status_code == 413, f"Expected 413, got {r.status_code}: {r.text[:200]}"


def test_upload_file_over_10mb_returns_413():
    big = b"x" * (10 * 1024 * 1024 + 1024)
    r = requests.post(
        f"{API}/wellington/upload-file",
        files={"file": ("big.txt", io.BytesIO(big), "text/plain")},
        data={"filename": "big.txt"},
        timeout=60,
    )
    assert r.status_code == 413, f"Expected 413, got {r.status_code}: {r.text[:200]}"


def test_upload_image_small_not_413():
    r = requests.post(
        f"{API}/wellington/upload-image",
        files={"file": ("small.bin", io.BytesIO(b"hello"), "application/octet-stream")},
        timeout=30,
    )
    assert r.status_code != 413


# ---------- SEC-003 rate limit on analyze-url (10/min) ----------
def test_rate_limit_analyze_url():
    hits = []
    # Use a bad-but-blocked host so it short-circuits fast and still counts a hit
    for i in range(14):
        r = requests.post(f"{API}/wellington/analyze-url",
                          data={"url": "http://127.0.0.1/"}, timeout=10)
        hits.append(r.status_code)
        if r.status_code == 429:
            break
    assert 429 in hits, f"Expected a 429 within 14 rapid calls, got: {hits}"


# ---------- SEC-003 reset confirmation ----------
def test_reset_without_confirm_returns_400_and_preserves_portfolio():
    # Snapshot account before
    before = requests.get(f"{API}/paper-trading/account", timeout=15)
    assert before.status_code == 200
    before_orders = len(before.json().get("order_history", []))
    before_positions = len(before.json().get("positions", []))

    # Empty body - must be rejected
    r1 = requests.post(f"{API}/paper-trading/reset", json={}, timeout=15)
    assert r1.status_code == 400, f"Empty confirm should be 400, got {r1.status_code}"

    # Wrong confirm string
    r2 = requests.post(f"{API}/paper-trading/reset", json={"confirm": "nope"}, timeout=15)
    assert r2.status_code == 400, f"Wrong confirm should be 400, got {r2.status_code}"

    # Verify portfolio unchanged
    after = requests.get(f"{API}/paper-trading/account", timeout=15)
    assert after.status_code == 200
    after_orders = len(after.json().get("order_history", []))
    after_positions = len(after.json().get("positions", []))
    assert after_orders == before_orders, f"Orders changed: {before_orders} -> {after_orders}"
    assert after_positions == before_positions


# ---------- Error disclosure sanitization ----------
def test_error_messages_are_generic():
    r = requests.post(f"{API}/wellington/analyze-url", data={"url": "http://127.0.0.1/"}, timeout=10)
    text = r.text
    assert "Traceback" not in text
    assert "File \"/app" not in text


# ---------- Regression: core read endpoints ----------
def test_paper_account_ok():
    r = requests.get(f"{API}/paper-trading/account", timeout=20)
    assert r.status_code == 200
    a = r.json()
    assert "positions" in a and "order_history" in a
    assert len(a["positions"]) >= 10, f"Expected ~16 positions, got {len(a['positions'])}"
    assert len(a["order_history"]) >= 100, f"Expected ~150 orders, got {len(a['order_history'])}"
    assert a.get("total_value", 0) > 50_000_000


def test_watchlist_50():
    r = requests.get(f"{API}/paper-trading/watchlist", timeout=20)
    assert r.status_code == 200
    data = r.json()
    items = data if isinstance(data, list) else data.get("watchlist") or data.get("items") or []
    assert len(items) == 75, f"Expected 75 watchlist items, got {len(items)}"


def test_market_data():
    r = requests.get(f"{API}/market/data", timeout=20)
    assert r.status_code == 200


def test_macro_regime():
    r = requests.get(f"{API}/macro/regime", timeout=20)
    assert r.status_code == 200


def test_sec_13f_10_funds():
    r = requests.get(f"{API}/sec/13f", timeout=20)
    assert r.status_code == 200
    data = r.json()
    funds = data if isinstance(data, list) else data.get("funds") or data.get("data") or []
    assert len(funds) == 15, f"Expected 15 hedge funds, got {len(funds)}"


def test_dashboard_summary():
    r = requests.get(f"{API}/dashboard/summary", timeout=20)
    assert r.status_code == 200
