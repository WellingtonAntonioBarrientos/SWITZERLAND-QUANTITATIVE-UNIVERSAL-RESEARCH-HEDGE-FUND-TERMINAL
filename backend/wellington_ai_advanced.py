# Wellington AI - Advanced Claude Integration
# Maximum Capacity Financial Supercomputer with Multi-Mode Analysis

from datetime import datetime, timezone
from typing import List, Dict, Optional, Literal
import logging
from emergentintegrations.llm.chat import LlmChat, UserMessage
import os

AnalysisMode = Literal["deep_analysis", "code_generation", "research", "strategy_builder", "standard"]

class AdvancedWellingtonAI:
    """
    Enhanced Wellington AI with Maximum Claude Capabilities
    
    Features:
    - Chain-of-Thought reasoning with XML tags
    - Multi-mode analysis (Deep, Code, Research, Strategy)
    - Code generation for trading algorithms
    - Advanced prompting techniques from 2025-2026 best practices
    """
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.model = "claude-sonnet-4-6"
        self.provider = "anthropic"
        self.conversation_history = []
        
    def create_advanced_chat(self, session_id: str, mode: AnalysisMode = "standard"):
        """Create chat with mode-specific system message"""
        
        system_messages = {
            "deep_analysis": """You are Wellington AI in DEEP ANALYSIS mode.

Use chain-of-thought reasoning with XML tags:
<thinking>
Step 1: Analyze the problem
Step 2: Consider multiple perspectives
Step 3: Evaluate evidence
Step 4: Synthesize insights
</thinking>

<answer>
Final comprehensive answer with actionable recommendations
</answer>

Capabilities:
- Multi-pass reasoning with self-critique
- Consider alternative scenarios
- Quantify uncertainty
- Provide confidence levels
- Challenge assumptions

Response format: Always use <thinking> and <answer> tags.""",

            "code_generation": """You are Wellington AI in CODE GENERATION mode.

You write production-ready trading code with:
- Proper backtesting methodology (walk-forward validation)
- Risk management (position sizing, stop-loss, drawdown limits)
- Data validation and error handling
- Clean, documented code
- Performance optimization

Languages: Python, JavaScript
Libraries: pandas, numpy, yfinance, ta-lib, backtrader

Always include:
1. Strategy logic
2. Backtesting framework
3. Risk management
4. Performance metrics
5. Usage examples""",

            "research": """You are Wellington AI in RESEARCH mode.

Conduct comprehensive market research:
1. Gather data from multiple sources
2. Cross-reference information
3. Identify patterns and trends
4. Assess credibility
5. Synthesize findings

Use <research_process> tags to show your methodology.
Cite reasoning for conclusions.
Quantify confidence levels (Low/Medium/High).""",

            "strategy_builder": """You are Wellington AI in STRATEGY BUILDER mode.

Guide users step-by-step to create trading strategies:
1. Define objectives (ROI target, risk tolerance, timeframe)
2. Select instruments and markets
3. Design entry/exit rules
4. Implement risk management
5. Create backtesting plan
6. Optimize and validate

Use interactive, guided approach. Ask clarifying questions.
Build strategies incrementally with user feedback.""",

            "standard": """You are Wellington AI, an advanced financial supercomputer.

Use Constitutional AI principles: helpful, harmless, honest.
Apply chain-of-thought reasoning for complex problems.
Provide actionable insights with confidence levels.
Challenge assumptions when appropriate."""
        }
        
        return LlmChat(
            api_key=self.api_key,
            session_id=session_id,
            system_message=system_messages.get(mode, system_messages["standard"])
        ).with_model(self.provider, self.model)
    
    async def deep_analysis(self, query: str, context: Dict) -> Dict:
        """
        Multi-pass deep analysis with chain-of-thought reasoning
        
        Returns structured analysis with thinking process exposed
        """
        chat = self.create_advanced_chat(f"deep-analysis-{datetime.now().timestamp()}", "deep_analysis")
        
        prompt = f"""<analysis_request>
Query: {query}

Context:
{self._format_context(context)}
</analysis_request>

Perform DEEP ANALYSIS using chain-of-thought reasoning.
Consider multiple scenarios, challenge assumptions, and provide confidence levels.

Use this structure:
<thinking>
1. Problem decomposition
2. Data analysis
3. Alternative scenarios
4. Risk assessment
5. Synthesis
</thinking>

<answer>
Comprehensive answer with:
- Key findings
- Confidence levels (High/Medium/Low)
- Actionable recommendations
- Risk factors
- Expected outcomes
</answer>"""

        try:
            response = await chat.send_message(UserMessage(text=prompt))
            return self._parse_structured_response(response, "deep_analysis")
        except Exception as e:
            logging.error(f"Deep analysis error: {e}")
            return {"error": str(e), "mode": "deep_analysis"}
    
    async def generate_trading_code(self, strategy_description: str, parameters: Dict) -> Dict:
        """
        Generate production-ready trading algorithm code
        
        Args:
            strategy_description: Strategy concept
            parameters: {
                "instruments": ["SPY", "QQQ"],
                "timeframe": "daily",
                "risk_per_trade": 2,
                "max_positions": 5
            }
        """
        chat = self.create_advanced_chat(f"code-gen-{datetime.now().timestamp()}", "code_generation")
        
        prompt = f"""Generate a complete trading algorithm:

STRATEGY: {strategy_description}

PARAMETERS:
{self._format_dict(parameters)}

REQUIREMENTS:
1. Python implementation using pandas, yfinance
2. Walk-forward validation to prevent overfitting
3. Position sizing and risk management
4. Stop-loss and take-profit logic
5. Performance metrics (Sharpe, drawdown, win rate)
6. Backtesting framework
7. Clean, documented code

OUTPUT FORMAT:
```python
# Strategy name
# Description

import pandas as pd
import yfinance as yf
import numpy as np

class TradingStrategy:
    def __init__(self, ...):
        # Initialize
        
    def generate_signals(self, data):
        # Signal generation logic
        
    def backtest(self, data):
        # Backtesting with walk-forward validation
        
    def calculate_metrics(self, results):
        # Performance metrics
        
# Usage example
if __name__ == "__main__":
    strategy = TradingStrategy(...)
    results = strategy.backtest(data)
    print(strategy.calculate_metrics(results))
```

Include complete, runnable code with error handling."""

        try:
            response = await chat.send_message(UserMessage(text=prompt))
            return {
                "code": self._extract_code(response),
                "explanation": response,
                "mode": "code_generation"
            }
        except Exception as e:
            return {"error": str(e), "mode": "code_generation"}
    
    async def market_research(self, topic: str, depth: str = "comprehensive") -> Dict:
        """
        Comprehensive market research with source validation
        
        Args:
            depth: "quick", "standard", "comprehensive"
        """
        chat = self.create_advanced_chat(f"research-{datetime.now().timestamp()}", "research")
        
        depth_config = {
            "quick": "high-level overview, key points only",
            "standard": "balanced analysis, major trends",
            "comprehensive": "exhaustive research, all angles"
        }
        
        prompt = f"""<research_task>
Topic: {topic}
Depth: {depth_config.get(depth, depth_config['standard'])}
</research_task>

Conduct {depth} market research:

<research_process>
1. Define key questions
2. Identify data sources
3. Analyze information
4. Cross-reference findings
5. Assess implications
6. Draw conclusions
</research_process>

Provide:
- Executive summary
- Key findings (with confidence levels)
- Market implications
- Trading opportunities
- Risk factors
- Data sources/reasoning

Format findings clearly with confidence indicators."""

        try:
            response = await chat.send_message(UserMessage(text=prompt))
            return self._parse_structured_response(response, "research")
        except Exception as e:
            return {"error": str(e), "mode": "research"}
    
    async def build_strategy_interactive(self, user_input: str, conversation_state: Dict) -> Dict:
        """
        Interactive strategy building with guided questions
        """
        chat = self.create_advanced_chat(f"strategy-{datetime.now().timestamp()}", "strategy_builder")
        
        stage = conversation_state.get("stage", "objectives")
        
        prompt = f"""<strategy_session>
Current Stage: {stage}
User Input: {user_input}
Previous Context: {conversation_state.get('context', 'None')}
</strategy_session>

Guide the user through strategy creation:

Stage 1 - Objectives: ROI target, risk tolerance, timeframe
Stage 2 - Instruments: What to trade
Stage 3 - Rules: Entry/exit conditions
Stage 4 - Risk: Position sizing, stops
Stage 5 - Testing: Backtest plan

Ask specific questions to move forward.
Build strategy incrementally.
Provide examples when helpful."""

        try:
            response = await chat.send_message(UserMessage(text=prompt))
            return {
                "response": response,
                "next_stage": self._determine_next_stage(response, stage),
                "mode": "strategy_builder"
            }
        except Exception as e:
            return {"error": str(e), "mode": "strategy_builder"}
    
    async def multi_agent_debate(self, question: str, perspectives: List[str]) -> Dict:
        """
        Multi-agent reasoning: Different perspectives debate, then synthesis
        
        Best practice from 2026 for complex decisions
        """
        results = {}
        
        for perspective in perspectives:
            chat = self.create_advanced_chat(f"debate-{perspective}", "deep_analysis")
            prompt = f"""Take the perspective of: {perspective}

Question: {question}

Argue from your perspective using evidence and reasoning.
Use <thinking> tags to show your logic."""

            try:
                response = await chat.send_message(UserMessage(text=prompt))
                results[perspective] = response
            except Exception as e:
                results[perspective] = f"Error: {e}"
        
        # Synthesis
        synthesis_chat = self.create_advanced_chat("debate-synthesis", "deep_analysis")
        synthesis_prompt = f"""Different perspectives have debated: {question}

{self._format_dict(results)}

Synthesize these perspectives:
1. Find common ground
2. Identify contradictions
3. Weigh evidence
4. Provide balanced conclusion

Use <thinking> and <answer> tags."""

        try:
            synthesis = await synthesis_chat.send_message(UserMessage(text=synthesis_prompt))
            return {
                "perspectives": results,
                "synthesis": synthesis,
                "mode": "multi_agent_debate"
            }
        except Exception as e:
            return {"perspectives": results, "error": str(e)}
    
    # Helper methods
    def _format_context(self, context: Dict) -> str:
        lines = []
        for key, value in context.items():
            lines.append(f"{key}: {value}")
        return "\n".join(lines)
    
    def _format_dict(self, d: Dict) -> str:
        import json
        return json.dumps(d, indent=2)
    
    def _parse_structured_response(self, response: str, mode: str) -> Dict:
        """Extract thinking and answer from XML tags"""
        thinking = ""
        answer = ""
        
        # Extract <thinking> content
        if "<thinking>" in response:
            start = response.find("<thinking>") + 10
            end = response.find("</thinking>")
            if end > start:
                thinking = response[start:end].strip()
        
        # Extract <answer> content
        if "<answer>" in response:
            start = response.find("<answer>") + 8
            end = response.find("</answer>")
            if end > start:
                answer = response[start:end].strip()
        
        return {
            "thinking": thinking or "Not provided",
            "answer": answer or response,
            "full_response": response,
            "mode": mode
        }
    
    def _extract_code(self, response: str) -> str:
        """Extract code blocks from response"""
        if "```python" in response:
            start = response.find("```python") + 9
            end = response.find("```", start)
            if end > start:
                return response[start:end].strip()
        return response
    
    def _determine_next_stage(self, response: str, current_stage: str) -> str:
        """Determine next stage in strategy building"""
        stages = ["objectives", "instruments", "rules", "risk", "testing", "complete"]
        current_idx = stages.index(current_stage) if current_stage in stages else 0
        
        # Simple logic - move forward if response is substantial
        if len(response) > 100 and current_idx < len(stages) - 1:
            return stages[current_idx + 1]
        return current_stage

# Singleton
_advanced_wellington = None

def get_advanced_wellington(api_key: str = None) -> AdvancedWellingtonAI:
    global _advanced_wellington
    if _advanced_wellington is None:
        if api_key is None:
            api_key = os.environ.get('EMERGENT_LLM_KEY')
        _advanced_wellington = AdvancedWellingtonAI(api_key)
    return _advanced_wellington
