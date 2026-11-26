# Wellington AI - Advanced Financial Supercomputer
# Combines Claude AI with multi-source market intelligence for autonomous trading

from datetime import datetime, timezone
from typing import List, Dict, Optional
import logging
from emergentintegrations.llm.chat import LlmChat, UserMessage
import os
import base64
from pathlib import Path

class WellingtonAI:
    """
    Wellington AI: Autonomous Financial Intelligence System
    
    Capabilities:
    - Multi-source market analysis
    - Autonomous trading decisions
    - Learning from historical data
    - Real-time strategy optimization
    - File & image analysis
    - Website content extraction
    """
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.model = "claude-sonnet-4-6"
        self.provider = "anthropic"
        self.trading_history = []
        self.learning_data = {
            "successful_trades": [],
            "failed_trades": [],
            "market_insights": [],
            "strategy_adjustments": []
        }
        self.analysis_cache = {}  # Cache for URL/file analyses
        
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
        ).with_model(self.provider, self.model)
    
    async def analyze_watchlist(self, watchlist: List[Dict], account_data: Dict, roi_target: float = 50.0) -> Dict:
        """
        Analyze watchlist and generate trading recommendations based on ROI target
        
        Args:
            roi_target: Desired ROI percentage (50, 60, 80, 100, or 1000+ for unlimited)
        
        Returns: {
            "recommendations": [{"symbol", "action", "confidence", "reasoning", "expected_roi"}],
            "portfolio_advice": str,
            "risk_assessment": str,
            "strategy": str
        }
        """
        chat = self.create_chat_session("watchlist-analysis")
        
        # Build comprehensive analysis prompt
        watchlist_summary = self._format_watchlist(watchlist[:15])  # Top 15 for better analysis
        account_summary = self._format_account(account_data)
        
        # Adjust strategy based on ROI target
        if roi_target >= 1000:
            risk_profile = "ULTRA-AGGRESSIVE"
            strategy_guidance = """Focus on:
- High-volatility stocks with explosive potential (small/mid caps)
- Momentum plays with 10x+ upside potential
- Options-like leverage through concentrated positions
- High-growth tech, biotech, or speculative sectors
- Accept 80%+ position risk for potential 1000%+ gains"""
            position_sizing = "50-100% allocation per trade (concentrated bets)"
        elif roi_target >= 100:
            risk_profile = "VERY AGGRESSIVE"
            strategy_guidance = """Focus on:
- High-growth momentum stocks
- Volatile tech names with strong catalysts
- Position size: 30-40% per trade
- Accept higher drawdown risk for 100%+ potential"""
            position_sizing = "30-40% allocation per trade"
        elif roi_target >= 80:
            risk_profile = "AGGRESSIVE"
            strategy_guidance = """Focus on:
- Growth stocks with strong momentum
- Technical breakouts with 80%+ upside
- Position size: 20-30% per trade
- Higher risk tolerance for higher returns"""
            position_sizing = "20-30% allocation per trade"
        elif roi_target >= 60:
            risk_profile = "MODERATE-AGGRESSIVE"
            strategy_guidance = """Focus on:
- Quality growth stocks
- Hedge fund favorites showing momentum
- Position size: 15-20% per trade
- Balance risk/reward for 60%+ target"""
            position_sizing = "15-20% allocation per trade"
        else:  # 50%
            risk_profile = "MODERATE"
            strategy_guidance = """Focus on:
- Blue-chip stocks with steady growth
- Proven hedge fund positions
- Position size: 10-15% per trade
- Conservative 50% target with downside protection"""
            position_sizing = "10-15% allocation per trade"
        
        prompt = f"""You are Wellington AI managing $500 automated trading allocation.

ROI TARGET: {roi_target}% 
RISK PROFILE: {risk_profile}
{strategy_guidance}

WATCHLIST (Top Institutional Holdings):
{watchlist_summary}

CURRENT ACCOUNT:
{account_summary}

TASK: Identify the BEST trades to achieve {roi_target}% ROI or higher.

Provide recommendations in this exact JSON format:
{{
  "recommendations": [
    {{
      "symbol": "TICKER",
      "action": "BUY",
      "confidence": 9,
      "reasoning": "Specific catalyst/technical reason for {roi_target}%+ potential",
      "expected_roi": 150,
      "entry_price": 250.50,
      "target_price": 625.00,
      "stop_loss": 200.00,
      "position_size": 200,
      "time_horizon": "2-4 weeks"
    }}
  ],
  "risk_level": "{risk_profile}",
  "market_outlook": "Brief market assessment",
  "strategy": "How to achieve {roi_target}% ROI",
  "disclaimer": "Risk warning for {risk_profile} strategy"
}}

Position Sizing: {position_sizing}
Minimum Confidence: {8 if roi_target >= 100 else 7}
Select 2-3 HIGHEST CONVICTION trades that can realistically achieve {roi_target}%+ returns."""

        try:
            response = await chat.send_message(UserMessage(text=prompt))
            analysis = self._parse_ai_response(response)
            analysis["roi_target"] = roi_target
            analysis["risk_profile"] = risk_profile
            return analysis
        except Exception as e:
            logging.error(f"Wellington AI analysis error: {e}")
            return {"error": str(e), "recommendations": [], "roi_target": roi_target}
    
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
    
    async def chat_with_wellington(self, user_message: str, context: Dict, 
                                   image_data: Optional[str] = None,
                                   file_content: Optional[str] = None,
                                   url_content: Optional[str] = None) -> str:
        """
        Chat interface for Wellington AI with multimodal support
        
        Args:
            user_message: User's question/command
            context: Current app context (account, positions, market data)
            image_data: Base64 encoded image for analysis
            file_content: Extracted text from uploaded file
            url_content: Extracted content from website
        
        Returns: Wellington AI's response
        """
        chat = self.create_chat_session(f"chat-{datetime.now().timestamp()}")
        
        # Build context-aware prompt
        context_str = self._build_context_string(context)
        
        # Build multimodal prompt
        full_prompt = f"""Context:
{context_str}

User: {user_message}"""

        # Add file content if provided
        if file_content:
            full_prompt += f"""

Uploaded Document Content:
```
{file_content[:5000]}  # Limit to 5000 chars
```

Analyze this document in the context of financial markets and trading."""

        # Add URL content if provided
        if url_content:
            full_prompt += f"""

Website Content:
```
{url_content[:5000]}
```

Analyze this content and provide financial insights."""

        full_prompt += "\n\nRespond as Wellington AI with actionable insights."

        try:
            # If image is provided, use vision capabilities
            if image_data:
                # Claude supports vision - send image with prompt
                response = await chat.send_message(UserMessage(
                    text=full_prompt,
                    image_data=image_data  # Base64 image
                ))
            else:
                response = await chat.send_message(UserMessage(text=full_prompt))
            
            return response
        except Exception as e:
            logging.error(f"Wellington chat error: {e}")
            return f"Wellington AI Error: {str(e)}"
    
    async def stream_chat(self, user_message: str, context: Dict):
        """Streaming variant of chat_with_wellington: yields text deltas"""
        from emergentintegrations.llm.chat import TextDelta, StreamDone
        chat = self.create_chat_session(f"chat-{datetime.now().timestamp()}")
        context_str = self._build_context_string(context)
        full_prompt = f"""Context:
{context_str}

User: {user_message}

Respond as Wellington AI with actionable insights."""
        async for event in chat.stream_message(UserMessage(text=full_prompt)):
            if isinstance(event, TextDelta):
                yield event.content
            elif isinstance(event, StreamDone):
                break
    
    async def analyze_image(self, image_data: str, prompt: str = None) -> str:
        """
        Analyze financial charts, screenshots, or documents
        
        Args:
            image_data: Base64 encoded image
            prompt: Optional specific analysis request
        
        Returns: Wellington AI's analysis
        """
        chat = self.create_chat_session(f"image-analysis-{datetime.now().timestamp()}")
        
        if not prompt:
            prompt = """Analyze this financial image/chart. Identify:
1. Chart type (candlestick, line, bar, etc.)
2. Timeframe and symbols
3. Key technical patterns (support/resistance, trends, indicators)
4. Trading signals (buy/sell opportunities)
5. Risk assessment
6. Recommended actions

Provide a comprehensive analysis with specific price levels and actionable insights."""

        try:
            response = await chat.send_message(UserMessage(
                text=prompt,
                image_data=image_data
            ))
            return response
        except Exception as e:
            return f"Image analysis error: {str(e)}"
    
    async def analyze_url(self, url: str, content: str) -> str:
        """
        Analyze website content (news articles, reports, etc.)
        
        Args:
            url: Website URL
            content: Extracted text content
        
        Returns: Wellington AI's analysis
        """
        # Check cache
        cache_key = f"url-{url}"
        if cache_key in self.analysis_cache:
            cached = self.analysis_cache[cache_key]
            if (datetime.now(timezone.utc) - cached["timestamp"]).seconds < 3600:  # 1 hour cache
                return cached["analysis"]
        
        chat = self.create_chat_session(f"url-analysis-{datetime.now().timestamp()}")
        
        prompt = f"""Analyze this financial content from {url}:

{content[:5000]}

Provide:
1. Key takeaways and market impact
2. Trading implications (which stocks/sectors affected)
3. Sentiment analysis (bullish/bearish/neutral)
4. Recommended actions for traders
5. Risk factors mentioned

Be concise and actionable."""

        try:
            response = await chat.send_message(UserMessage(text=prompt))
            
            # Cache the result
            self.analysis_cache[cache_key] = {
                "timestamp": datetime.now(timezone.utc),
                "analysis": response
            }
            
            return response
        except Exception as e:
            return f"URL analysis error: {str(e)}"
    
    async def analyze_file(self, file_content: str, filename: str) -> str:
        """
        Analyze uploaded documents (PDFs, financial reports, etc.)
        
        Args:
            file_content: Extracted text content
            filename: Original filename
        
        Returns: Wellington AI's analysis
        """
        chat = self.create_chat_session(f"file-analysis-{datetime.now().timestamp()}")
        
        file_type = Path(filename).suffix.lower()
        
        prompt = f"""Analyze this financial document ({filename}):

{file_content[:8000]}  # Larger limit for files

Provide:
1. Document summary
2. Key financial metrics/data points
3. Investment insights
4. Trading opportunities identified
5. Risk factors
6. Actionable recommendations

Format: Clear sections with bullet points."""

        try:
            response = await chat.send_message(UserMessage(text=prompt))
            return response
        except Exception as e:
            return f"File analysis error: {str(e)}"
    
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
        except Exception:
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
