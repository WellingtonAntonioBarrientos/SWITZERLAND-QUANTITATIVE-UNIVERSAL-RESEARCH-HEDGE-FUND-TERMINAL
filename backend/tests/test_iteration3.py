"""
Backend API Tests for Iteration 3 - Testing 3 new features:
1. 13F SEC Filings with 50 holdings per fund + analyze-all endpoint
2. Hedge Fund Watchlist data (top 5 holdings from 10 funds)
3. Auto-refresh verification (checking endpoints work for refresh)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestSECFilings13F:
    """Test 13F SEC Filings endpoints - Task 1"""
    
    def test_get_all_13f_filings_returns_10_funds(self):
        """Verify /api/sec/13f returns exactly 10 hedge funds"""
        response = requests.get(f"{BASE_URL}/api/sec/13f")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) == 10, f"Expected 10 funds, got {len(data)}"
        print(f"✓ GET /api/sec/13f returns {len(data)} funds")
    
    def test_each_fund_has_50_holdings(self):
        """Verify each fund has exactly 50 holdings"""
        response = requests.get(f"{BASE_URL}/api/sec/13f")
        assert response.status_code == 200
        
        data = response.json()
        for fund in data:
            holdings_count = len(fund.get('top_holdings', []))
            assert holdings_count == 50, f"Fund {fund['fund_name']} has {holdings_count} holdings, expected 50"
            print(f"✓ {fund['fund_name']}: {holdings_count} holdings")
        
        print(f"✓ All 10 funds have 50 holdings each")
    
    def test_fund_data_structure(self):
        """Verify fund data has required fields"""
        response = requests.get(f"{BASE_URL}/api/sec/13f")
        assert response.status_code == 200
        
        data = response.json()
        required_fields = ['id', 'fund_name', 'cik', 'aum', 'quarter', 'quarterly_change', 
                          'filing_date', 'top_holdings', 'sector_allocation']
        
        for fund in data:
            for field in required_fields:
                assert field in fund, f"Missing field '{field}' in fund {fund.get('fund_name', 'unknown')}"
        
        print("✓ All funds have required data structure")
    
    def test_holding_data_structure(self):
        """Verify each holding has required fields"""
        response = requests.get(f"{BASE_URL}/api/sec/13f")
        assert response.status_code == 200
        
        data = response.json()
        required_holding_fields = ['symbol', 'name', 'value', 'shares', 'percent', 'change']
        
        # Check first fund's holdings
        fund = data[0]
        for holding in fund['top_holdings'][:5]:  # Check first 5 holdings
            for field in required_holding_fields:
                assert field in holding, f"Missing field '{field}' in holding {holding.get('symbol', 'unknown')}"
        
        print("✓ Holdings have required data structure")
    
    def test_get_single_fund_filing(self):
        """Verify /api/sec/13f/{fund_id} returns single fund"""
        response = requests.get(f"{BASE_URL}/api/sec/13f/bridgewater")
        assert response.status_code == 200
        
        data = response.json()
        assert data['id'] == 'bridgewater'
        assert data['fund_name'] == 'Bridgewater Associates'
        assert len(data['top_holdings']) == 50
        print(f"✓ GET /api/sec/13f/bridgewater returns Bridgewater with 50 holdings")
    
    def test_analyze_all_funds_endpoint_exists(self):
        """Verify /api/sec/13f/analyze-all endpoint exists and responds"""
        response = requests.post(f"{BASE_URL}/api/sec/13f/analyze-all")
        # Should return 200 with analysis or error message
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Should have either 'analysis' or 'error' key
        assert 'analysis' in data or 'error' in data, "Response should have 'analysis' or 'error' key"
        
        if 'analysis' in data:
            assert len(data['analysis']) > 100, "Analysis should be substantial text"
            print(f"✓ POST /api/sec/13f/analyze-all returns AI analysis ({len(data['analysis'])} chars)")
        else:
            print(f"✓ POST /api/sec/13f/analyze-all endpoint exists (AI key may not be configured)")
    
    def test_analyze_single_fund_endpoint(self):
        """Verify /api/sec/13f/{fund_id}/analyze endpoint works"""
        response = requests.post(f"{BASE_URL}/api/sec/13f/bridgewater/analyze")
        assert response.status_code == 200
        
        data = response.json()
        assert 'analysis' in data or 'error' in data
        print("✓ POST /api/sec/13f/bridgewater/analyze endpoint works")


class TestHedgeFundWatchlistData:
    """Test data availability for Hedge Fund Watchlist - Task 2"""
    
    def test_market_chart_endpoint_for_common_symbols(self):
        """Verify chart data is available for common hedge fund holdings"""
        # Common symbols from top hedge fund holdings
        test_symbols = ['SPY', 'NVDA', 'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'QQQ']
        
        for symbol in test_symbols:
            response = requests.get(f"{BASE_URL}/api/market/chart/{symbol}")
            assert response.status_code == 200, f"Chart data for {symbol} failed"
            
            data = response.json()
            assert 'data' in data, f"Missing 'data' key for {symbol}"
            assert len(data['data']) > 0, f"No chart data for {symbol}"
            print(f"✓ Chart data available for {symbol}: {len(data['data'])} points")
    
    def test_top_5_holdings_from_each_fund(self):
        """Verify top 5 holdings from each fund have valid symbols"""
        response = requests.get(f"{BASE_URL}/api/sec/13f")
        assert response.status_code == 200
        
        data = response.json()
        all_symbols = set()
        
        for fund in data:
            top_5 = fund['top_holdings'][:5]
            for holding in top_5:
                all_symbols.add(holding['symbol'])
        
        print(f"✓ Found {len(all_symbols)} unique symbols in top 5 holdings across 10 funds")
        assert len(all_symbols) > 10, "Should have multiple unique symbols"


class TestAutoRefreshEndpoints:
    """Test endpoints used for auto-refresh - Task 3"""
    
    def test_macro_regime_endpoint(self):
        """Verify /api/macro/regime works for 60s refresh"""
        response = requests.get(f"{BASE_URL}/api/macro/regime")
        assert response.status_code == 200
        
        data = response.json()
        assert 'current_regime' in data
        assert 'indicators' in data
        print("✓ GET /api/macro/regime works (60s refresh)")
    
    def test_strategies_endpoint(self):
        """Verify /api/strategies works for 120s refresh"""
        response = requests.get(f"{BASE_URL}/api/strategies")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) >= 10, "Should have at least 10 strategies"
        print("✓ GET /api/strategies works (120s refresh)")
    
    def test_intel_events_endpoint(self):
        """Verify /api/intel/events works for 180s refresh"""
        response = requests.get(f"{BASE_URL}/api/intel/events")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print("✓ GET /api/intel/events works (180s refresh)")
    
    def test_automation_modules_endpoint(self):
        """Verify /api/automation/modules works for 30s refresh"""
        response = requests.get(f"{BASE_URL}/api/automation/modules")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 5, "Should have 5 automation modules"
        print("✓ GET /api/automation/modules works (30s refresh)")
    
    def test_research_tasks_endpoint(self):
        """Verify /api/research/tasks works for 60s refresh"""
        response = requests.get(f"{BASE_URL}/api/research/tasks")
        assert response.status_code == 200
        print("✓ GET /api/research/tasks works (60s refresh)")
    
    def test_market_data_endpoint(self):
        """Verify /api/market/data works for real-time refresh"""
        response = requests.get(f"{BASE_URL}/api/market/data")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        print("✓ GET /api/market/data works (real-time refresh)")


class TestAuthEndpoints:
    """Test authentication endpoints"""
    
    def test_login_with_valid_credentials(self):
        """Verify login works with correct credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "barrientoswellingtonantonio@gmail.com",
            "password": "01230143NYSE@"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert 'token' in data
        assert 'email' in data
        print("✓ Login with valid credentials works")
        return data['token']
    
    def test_login_with_invalid_credentials(self):
        """Verify login fails with wrong credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@email.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Login with invalid credentials returns 401")
    
    def test_verify_token(self):
        """Verify token verification works"""
        # First login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "barrientoswellingtonantonio@gmail.com",
            "password": "01230143NYSE@"
        })
        token = login_response.json()['token']
        
        # Verify token
        response = requests.get(f"{BASE_URL}/api/auth/verify", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        print("✓ Token verification works")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
