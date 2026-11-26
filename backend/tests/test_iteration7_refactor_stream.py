# Iteration 7: SSE streaming chat, non-stream chat regression, new 13F data, paper-trading baseline, security guards
import os
import json
import time
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    return sess


# --- New 13F data ---
class TestSEC13F:
    def test_15_funds_with_50_holdings(self, s):
        r = s.get(f"{API}/sec/13f", timeout=30)
        assert r.status_code == 200
        data = r.json()
        filings = data if isinstance(data, list) else (data.get("filings") or data.get("data") or [])
        assert len(filings) == 15, f"got {len(filings)}"
        names = " | ".join(f["fund_name"] for f in filings)
        for n in ["Jane Street", "Susquehanna", "Hudson River", "Optiver", "Jump Trading"]:
            assert n.lower() in names.lower(), f"{n} missing in {names}"
        for f in filings:
            assert len(f["top_holdings"]) == 50, f"{f['fund_name']} has {len(f['top_holdings'])}"
            assert "id" in f and "aum" in f

    def test_watchlist_75(self, s):
        r = s.get(f"{API}/paper-trading/watchlist", timeout=30)
        assert r.status_code == 200
        data = r.json()
        items = data if isinstance(data, list) else (data.get("watchlist") or data.get("items") or [])
        assert len(items) == 75, f"got {len(items)}"


# --- Paper trading baseline ---
class TestPaperAccount:
    def test_account_baseline(self, s):
        r = s.get(f"{API}/paper-trading/account", timeout=30)
        assert r.status_code == 200
        a = r.json()
        positions = a.get("positions", [])
        orders = a.get("orders", a.get("order_history", []))
        print("positions", len(positions), "orders", len(orders), "total", a.get("total_value"))
        assert len(positions) == 18
        assert len(orders) in (175, 176)
        assert 99_000_000 < a.get("total_value", 0) < 102_000_000


# --- Security guards ---
class TestSecurity:
    def test_reset_without_confirm_400(self, s):
        r = s.post(f"{API}/paper-trading/reset", json={}, timeout=30)
        assert r.status_code == 400

    def test_analyze_url_ssrf_400(self, s):
        r = s.post(f"{API}/wellington/analyze-url", data={"url": "http://127.0.0.1/"}, timeout=30)
        assert r.status_code == 400


# --- Wellington chat ---
class TestWellingtonChat:
    def test_non_stream_chat(self, s):
        r = s.post(f"{API}/wellington/chat", json={"message": "Say hello in one short sentence.", "include_context": False, "model": "claude-haiku-4-5-20251001"}, timeout=120)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        print({k: (str(v)[:80]) for k, v in d.items()})
        assert isinstance(d.get("response"), str) and len(d["response"]) > 0
        assert "error" not in d["response"].lower()[:40] or len(d["response"]) > 60

    def test_stream_chat_sse(self, s):
        t0 = time.time()
        r = s.post(f"{API}/wellington/chat/stream", json={"message": "hello in one sentence", "include_context": True, "model": "claude-haiku-4-5-20251001"}, stream=True, timeout=120)
        assert r.status_code == 200
        assert "text/event-stream" in r.headers.get("content-type", "")
        events, first_delta_t = [], None
        for line in r.iter_lines(decode_unicode=True):
            if line and line.startswith("data:"):
                evt = json.loads(line[5:])
                if evt["type"] == "delta" and first_delta_t is None:
                    first_delta_t = time.time() - t0
                events.append(evt)
                if evt["type"] in ("done", "error"):
                    break
        types = [e["type"] for e in events]
        print("types", types, "first_delta", first_delta_t, "total", time.time() - t0)
        assert types[0] == "start"
        assert "error" not in types, events
        assert types[-1] == "done"
        deltas = [e for e in events if e["type"] == "delta"]
        assert len(deltas) >= 1
        text = "".join(d["content"] for d in deltas)
        assert len(text) > 0
        assert events[0]["model_used"]
        print("text:", text[:200], "n_deltas", len(deltas))

    def test_stream_too_long_413(self, s):
        r = s.post(f"{API}/wellington/chat/stream", json={"message": "x" * 8001}, timeout=30)
        assert r.status_code == 413
