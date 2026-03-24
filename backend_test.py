import requests
import sys
import json
from datetime import datetime

class QuantFlowAPITester:
    def __init__(self, base_url="https://trading-platform-223.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, timeout=30):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=timeout)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=timeout)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, list):
                        print(f"   Response: List with {len(response_data)} items")
                    elif isinstance(response_data, dict):
                        print(f"   Response: Dict with keys: {list(response_data.keys())[:5]}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                self.failed_tests.append({
                    'name': name,
                    'expected': expected_status,
                    'actual': response.status_code,
                    'response': response.text[:200]
                })
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                'name': name,
                'error': str(e)
            })
            return False, {}

    def test_basic_endpoints(self):
        """Test basic API endpoints"""
        print("\n=== TESTING BASIC ENDPOINTS ===")
        
        # Root endpoint
        self.run_test("API Root", "GET", "", 200)
        
        # Dashboard summary
        self.run_test("Dashboard Summary", "GET", "dashboard/summary", 200)

    def test_market_data_endpoints(self):
        """Test market data endpoints"""
        print("\n=== TESTING MARKET DATA ENDPOINTS ===")
        
        # Market data
        self.run_test("Market Data", "GET", "market/data", 200)
        
        # Chart data
        self.run_test("Chart Data - SPY", "GET", "market/chart/SPY", 200)
        self.run_test("Chart Data - BTC", "GET", "market/chart/BTC/USD", 200)

    def test_macro_endpoints(self):
        """Test macro regime endpoints"""
        print("\n=== TESTING MACRO ENDPOINTS ===")
        
        # Macro regime
        self.run_test("Macro Regime", "GET", "macro/regime", 200)
        
        # Correlation matrix
        self.run_test("Correlation Matrix", "GET", "macro/correlation", 200)

    def test_intel_endpoints(self):
        """Test intel endpoints"""
        print("\n=== TESTING INTEL ENDPOINTS ===")
        
        # Intel events
        self.run_test("Intel Events", "GET", "intel/events", 200)

    def test_system_endpoints(self):
        """Test system health endpoints"""
        print("\n=== TESTING SYSTEM ENDPOINTS ===")
        
        # System health
        self.run_test("System Health", "GET", "system/health", 200)
        
        # System alerts
        self.run_test("System Alerts", "GET", "system/alerts", 200)

    def test_strategies_endpoints(self):
        """Test hedge fund strategies endpoints - NEW FEATURE"""
        print("\n=== TESTING STRATEGIES ENDPOINTS (NEW FEATURE) ===")
        
        # Get all strategies
        success, strategies = self.run_test("Get All Strategies", "GET", "strategies", 200)
        
        if success and strategies:
            print(f"   Found {len(strategies)} strategies")
            
            # Verify we have 10 strategies as expected
            if len(strategies) == 10:
                print("✅ Correct number of strategies (10)")
            else:
                print(f"❌ Expected 10 strategies, got {len(strategies)}")
            
            # Test individual strategy retrieval
            if strategies:
                first_strategy = strategies[0]
                strategy_id = first_strategy.get('id')
                if strategy_id:
                    self.run_test(f"Get Strategy - {strategy_id}", "GET", f"strategies/{strategy_id}", 200)
                    
                    # Test AI analysis for strategy
                    print(f"\n🧠 Testing AI Analysis for strategy: {strategy_id}")
                    success, analysis = self.run_test(f"AI Analysis - {strategy_id}", "POST", f"strategies/{strategy_id}/analyze", 200, timeout=60)
                    if success and analysis:
                        if 'analysis' in analysis:
                            print(f"✅ AI Analysis successful - Response length: {len(str(analysis['analysis']))}")
                        else:
                            print(f"❌ AI Analysis response missing 'analysis' field")
            
            # Test category filtering
            categories = set(s.get('category') for s in strategies if s.get('category'))
            print(f"   Found categories: {categories}")
            
            for category in list(categories)[:2]:  # Test first 2 categories
                self.run_test(f"Get Strategies by Category - {category}", "GET", f"strategies/category/{category}", 200)

    def test_research_endpoints(self):
        """Test research queue endpoints"""
        print("\n=== TESTING RESEARCH ENDPOINTS ===")
        
        # Get research tasks
        self.run_test("Get Research Tasks", "GET", "research/tasks", 200)
        
        # Create a test research task
        test_task = {
            "title": "Test Research Task",
            "description": "Testing API endpoint for research task creation",
            "priority": "MEDIUM",
            "tags": ["test", "api"]
        }
        success, task = self.run_test("Create Research Task", "POST", "research/tasks", 200, test_task)
        
        if success and task and task.get('id'):
            task_id = task['id']
            print(f"   Created task with ID: {task_id}")
            
            # Test AI analysis for research task
            print(f"\n🧠 Testing AI Analysis for research task: {task_id}")
            self.run_test(f"Analyze Research Task - {task_id}", "POST", f"research/tasks/{task_id}/analyze", 200, timeout=60)
            
            # Clean up - delete the test task
            self.run_test(f"Delete Research Task - {task_id}", "DELETE", f"research/tasks/{task_id}", 200)

    def test_approvals_endpoints(self):
        """Test approvals endpoints"""
        print("\n=== TESTING APPROVALS ENDPOINTS ===")
        
        # Get approvals
        success, approvals = self.run_test("Get Approvals", "GET", "approvals", 200)
        
        if success and approvals:
            # Test approval action on first approval if available
            first_approval = approvals[0] if approvals else None
            if first_approval and first_approval.get('id') and first_approval.get('status') == 'PENDING':
                approval_id = first_approval['id']
                action_data = {"action": "approve", "notes": "Test approval"}
                self.run_test(f"Process Approval - {approval_id}", "POST", f"approvals/{approval_id}/action", 200, action_data)

    def test_automation_endpoints(self):
        """Test automation endpoints"""
        print("\n=== TESTING AUTOMATION ENDPOINTS ===")
        
        # Automation V1 - Rules
        self.run_test("Get Automation Rules", "GET", "automation/rules", 200)
        
        # Create test rule
        test_rule = {
            "name": "Test Price Alert",
            "condition_type": "PRICE_ABOVE",
            "condition_value": 100.0,
            "action_type": "ALERT",
            "action_value": "BTC/USD"
        }
        success, rule = self.run_test("Create Automation Rule", "POST", "automation/rules", 200, test_rule)
        
        if success and rule and rule.get('id'):
            rule_id = rule['id']
            # Test toggle rule
            self.run_test(f"Toggle Rule - {rule_id}", "PUT", f"automation/rules/{rule_id}/toggle", 200)
            # Clean up
            self.run_test(f"Delete Rule - {rule_id}", "DELETE", f"automation/rules/{rule_id}", 200)
        
        # Automation V2 - Strategies
        self.run_test("Get Automation Strategies", "GET", "automation/strategies", 200)

    def test_terminal_endpoint(self):
        """Test terminal command execution"""
        print("\n=== TESTING TERMINAL ENDPOINT ===")
        
        # Test various terminal commands
        commands = [
            {"command": "help", "desc": "Help command"},
            {"command": "price BTC", "desc": "Price lookup"},
            {"command": "regime", "desc": "Macro regime"},
            {"command": "health", "desc": "System health"},
            {"command": "alerts", "desc": "System alerts"}
        ]
        
        for cmd in commands:
            self.run_test(f"Terminal - {cmd['desc']}", "POST", "terminal/execute", 200, {"command": cmd["command"]})

    def test_ai_query_endpoint(self):
        """Test AI assistant endpoint"""
        print("\n=== TESTING AI QUERY ENDPOINT ===")
        
        test_query = {
            "query": "What are the current market conditions for hedge fund strategies?",
            "context": "Testing AI integration"
        }
        print(f"\n🧠 Testing AI Query endpoint")
        self.run_test("AI Query", "POST", "ai/query", 200, test_query, timeout=60)

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting QuantFlow API Testing...")
        print(f"Testing against: {self.base_url}")
        
        # Run all test suites
        self.test_basic_endpoints()
        self.test_market_data_endpoints()
        self.test_macro_endpoints()
        self.test_intel_endpoints()
        self.test_system_endpoints()
        self.test_strategies_endpoints()  # NEW FEATURE TESTING
        self.test_research_endpoints()
        self.test_approvals_endpoints()
        self.test_automation_endpoints()
        self.test_terminal_endpoint()
        self.test_ai_query_endpoint()
        
        # Print final results
        print(f"\n📊 FINAL RESULTS:")
        print(f"Tests passed: {self.tests_passed}/{self.tests_run}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ FAILED TESTS ({len(self.failed_tests)}):")
            for i, test in enumerate(self.failed_tests, 1):
                print(f"{i}. {test['name']}")
                if 'error' in test:
                    print(f"   Error: {test['error']}")
                else:
                    print(f"   Expected: {test['expected']}, Got: {test['actual']}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = QuantFlowAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())