# Wellington AI - Advanced Financial Supercomputer
# Combines Claude AI with multi-source market intelligence for autonomous trading

from datetime import datetime, timezone
from typing import List, Dict, Optional
import logging
from emergentintegrations.llm import LlmChat, UserMessage
import os

class WellingtonAI:
    """
    Wellington AI: Autonomous Financial Intelligence System
    
    Capabilities:
    - Multi-source market analysis
    - Autonomous trading decisions
    - Learning from historical data
    - Real-time strategy optimization
    """
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.model = "claude-sonnet-4-5-20250929"
        self.trading_history = []
        self.learning_data = {
            "successful_trades": [],
            "failed_trades": [],
            "market_insights": [],
            "strategy_adjustments": []
        }
        
    def create_chat_session(self, session_id: str, system_message: str = None):
        """Create a new chat session with Wellington AI"""
        if not system_message:
            system_message = """You are Wellington AI, an advanced financial supercomputer with autonomous trading capabilities.

Your core competencies:
1. **Market Analysis**: Analyze stocks using technical indicators, hedge fund positioning, and macro trends
2. **Risk Management**: Calculate position sizes, stop-losses, and portfolio balance
3. **Autonomous Trading**: Make buy/sell decisions based on comprehensive analysis
4. **Learning**: Adapt strategies based on performance data
5. **Communication**: Explain complex financial concepts clearly and provide actionable insights

Current Context:
- You manage a $500 automated trading allocation within a $100M paper trading account
- You select from 50 institutional-grade stocks (Top 5 from 10 elite hedge funds)
- You have access to: 13F filings, market data, macro indicators, and global intel
- You learn from every trade to improve decision-making

Communication Style: Professional, data-driven, confident but cautious. Always explain your reasoning."""

        return LlmChat(
            api_key=self.api_key,
            session_id=session_id,
            system_message=system_message
        ).with_model("anthropic", self.model)
    
    async def analyze_watchlist(self, watchlist: List[Dict], account_data: Dict) -> Dict:
        """
        Analyze watchlist and generate trading recommendations
        
        Returns: {
            "recommendations": [{"symbol", "action", "confidence", "reasoning"}],
            "portfolio_advice": str,
            "risk_assessment": str
        }
        """
        chat = self.create_chat_session("watchlist-analysis")
        
        # Build comprehensive analysis prompt
        watchlist_summary = self._format_watchlist(watchlist[:10])  # Top 10 for analysis
        account_summary = self._format_account(account_data)
        
        prompt = f"""Analyze these top institutional holdings and provide trading recommendations for our $500 automated trading allocation:

{watchlist_summary}

Current Account Status:
{account_summary}

Please provide:
1. **Top 3 BUY Recommendations** (with confidence scores 1-10)
2. **Stocks to AVOID** (with reasoning)
3. **Risk Assessment** for current market conditions
4. **Portfolio Balance** recommendation

Format as JSON:
{{
  "recommendations": [
    {{"symbol": "TICKER", "action": "BUY/SELL", "confidence": 8, "reasoning": "...", "position_size": 100}}
  ],
  "avoid": ["TICKER1", "TICKER2"],
  "risk_level": "LOW/MEDIUM/HIGH",
  "market_outlook": "Brief assessment",
  "strategy": "Current strategy recommendation"
}}"""

        try:
            response = await chat.send_message(UserMessage(text=prompt))
            # Parse AI response
            return self._parse_ai_response(response)
        except Exception as e:
            logging.error(f"Wellington AI analysis error: {e}")
            return {"error": str(e), "recommendations": []}
    
    async def execute_autonomous_trade(self, recommendation: Dict, current_price: float) -> Dict:
        """
        Execute a trade based on AI recommendation
        
        Returns: Trade execution details
        """
        symbol = recommendation["symbol"]
        action = recommendation["action"]
        confidence = recommendation["confidence"]
        position_size = recommendation.get("position_size", 100)
        
        # Risk-adjusted position sizing based on confidence
        adjusted_size = int(position_size * (confidence / 10))
        
        trade = {
            "symbol": symbol,
            "action": action,
            "quantity": adjusted_size,
            "price": current_price,
            "confidence": confidence,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "ai_reasoning": recommendation["reasoning"]
        }
        
        self.trading_history.append(trade)
        return trade
    
    async def chat_with_wellington(self, user_message: str, context: Dict) -> str:
        """
        Chat interface for Wellington AI
        
        Args:
            user_message: User's question/command
            context: Current app context (account, positions, market data)
        
        Returns: Wellington AI's response
        """
        chat = self.create_chat_session(f"chat-{datetime.now().timestamp()}")
        
        # Build context-aware prompt
        context_str = self._build_context_string(context)
        
        full_prompt = f"""Context:
{context_str}

User: {user_message}

Respond as Wellington AI with actionable insights."""

        try:
            response = await chat.send_message(UserMessage(text=full_prompt))
            return response
        except Exception as e:
            return f"Wellington AI Error: {str(e)}"
    
    def learn_from_trade(self, trade_result: Dict):
        """
        Learn from trade outcomes to improve future decisions
        
        Args:
            trade_result: {
                "symbol", "entry_price", "exit_price", 
                "profit_loss", "duration", "success": bool
            }
        """
        if trade_result["success"]:
            self.learning_data["successful_trades"].append(trade_result)
            insight = f"Successful {trade_result['symbol']} trade: {trade_result['profit_loss']}% gain"
        else:
            self.learning_data["failed_trades"].append(trade_result)
            insight = f"Learning from {trade_result['symbol']}: {trade_result['profit_loss']}% loss"
        
        self.learning_data["market_insights"].append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "insight": insight,
            "trade": trade_result
        })
        
        # Adjust strategy based on success rate
        success_rate = len(self.learning_data["successful_trades"]) / max(len(self.trading_history), 1)
        
        if success_rate < 0.5:
            self.learning_data["strategy_adjustments"].append({
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "adjustment": "Reducing position sizes due to low success rate",
                "success_rate": success_rate
            })
    
    def get_performance_summary(self) -> Dict:
        """Get Wellington AI's performance metrics"""
        total_trades = len(self.trading_history)
        successful = len(self.learning_data["successful_trades"])
        failed = len(self.learning_data["failed_trades"])
        
        return {
            "total_trades": total_trades,
            "successful_trades": successful,
            "failed_trades": failed,
            "success_rate": (successful / max(total_trades, 1)) * 100,
            "active_since": self.trading_history[0]["timestamp"] if self.trading_history else None,
            "learning_insights": len(self.learning_data["market_insights"]),
            "strategy_adjustments": len(self.learning_data["strategy_adjustments"])
        }
    
    # Helper methods
    def _format_watchlist(self, watchlist: List[Dict]) -> str:
        """Format watchlist for AI analysis"""
        lines = []
        for item in watchlist:
            lines.append(f"{item['position']}. {item['symbol']} - {item['name']}")
            lines.append(f"   Price: ${item['current_price']:.2f} | Change: {item['change']}% | Hedge Fund: {item['hedge_fund']}")
        return "\n".join(lines)
    
    def _format_account(self, account: Dict) -> str:
        """Format account data for AI"""
        return f"""
- Total Value: ${account.get('total_value', 0)/1e6:.2f}M
- Cash Balance: ${account.get('cash_balance', 0)/1e6:.2f}M
- Trading Allocation: $500 (for automated trading)
- Current Positions: {len(account.get('positions', []))}
- Total P&L: ${account.get('total_pl', 0):.2f}
"""
    
    def _build_context_string(self, context: Dict) -> str:
        """Build comprehensive context string"""
        return f"""
Current Market State:
- Account Value: ${context.get('account_value', 0)}
- Active Positions: {context.get('positions_count', 0)}
- Wellington AI Allocation: $500
- Success Rate: {context.get('success_rate', 0)}%

Recent Insights:
{chr(10).join(context.get('recent_insights', ['No recent insights'])[:3])}
"""
    
    def _parse_ai_response(self, response: str) -> Dict:
        """Parse AI response into structured data"""
        import json
        try:
            # Try to extract JSON from response
            start = response.find('{')
            end = response.rfind('}') + 1
            if start >= 0 and end > start:
                json_str = response[start:end]
                return json.loads(json_str)
        except:
            pass
        
        # Fallback if JSON parsing fails
        return {
            "recommendations": [],
            "error": "Could not parse AI response",
            "raw_response": response
        }

# Singleton instance
_wellington_ai = None

def get_wellington_ai(api_key: str = None) -> WellingtonAI:
    """Get or create Wellington AI instance"""
    global _wellington_ai
    if _wellington_ai is None:
        if api_key is None:
            api_key = os.environ.get('EMERGENT_LLM_KEY')
        _wellington_ai = WellingtonAI(api_key)
    return _wellington_ai
