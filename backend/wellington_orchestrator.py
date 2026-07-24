# Wellington AI Orchestrator - Smart Auto-Detection System
# Automatically routes queries to the appropriate Wellington AI mode

from typing import Dict, Optional, Literal
import re
from wellington_ai import WellingtonAI
from wellington_ai_advanced import AdvancedWellingtonAI
import logging

QueryType = Literal["standard", "deep_analysis", "code_generation", "research", "strategy_builder", "debate"]

# Available Anthropic Claude models for the Wellington AI model picker
AVAILABLE_MODELS = [
    {"id": "claude-sonnet-4-6", "label": "Claude Sonnet 4.6", "tag": "Latest · Recommended"},
    {"id": "claude-opus-4-8", "label": "Claude Opus 4.8", "tag": "Most Powerful"},
    {"id": "claude-haiku-4-5-20251001", "label": "Claude Haiku 4.5", "tag": "Fastest"},
    {"id": "claude-sonnet-4-5-20250929", "label": "Claude Sonnet 4.5", "tag": "Stable"},
]
DEFAULT_MODEL = "claude-sonnet-4-6"

def resolve_model(model: Optional[str]) -> str:
    """Validate a requested model id, falling back to the default"""
    valid_ids = {m["id"] for m in AVAILABLE_MODELS}
    return model if model in valid_ids else DEFAULT_MODEL

class WellingtonOrchestrator:
    """
    Intelligent orchestrator that automatically detects query intent
    and routes to the appropriate Wellington AI engine (standard or advanced)
    """
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.standard_ai = WellingtonAI(api_key)
        self.advanced_ai = AdvancedWellingtonAI(api_key)
        
        # Query patterns for intelligent routing
        self.patterns = {
            "code_generation": [
                r'\b(write|create|generate|build|code|implement|develop)\b.*\b(algorithm|strategy|bot|script|function|class|program)\b',
                r'\b(backtest|backtesting)\b',
                r'\bpython\b.*\bcode\b',
                r'\bshow\s+me\s+(the\s+)?code\b',
                r'\bhow\s+to\s+code\b',
                r'\bgenerate.*trading.*algorithm\b'
            ],
            "deep_analysis": [
                r'\b(why|explain|analyze|reasoning|rationale|deep dive|investigate|examine)\b',
                r'\b(compare|contrast|evaluate|assess)\b.*\b(multiple|several|different)\b',
                r'\bpros\s+and\s+cons\b',
                r'\bthink\s+through\b',
                r'\bstep\s+by\s+step\b',
                r'\bdetailed\s+analysis\b',
                r'\bshould\s+i\b',
                r'\bwhat\s+if\b'
            ],
            "research": [
                r'\b(research|study|investigate|find\s+out|look\s+into|explore)\b',
                r'\b(trends|patterns|correlations|relationships)\b',
                r'\bmarket\s+(research|study|analysis)\b',
                r'\bwhat.*happening\b',
                r'\bsector\s+analysis\b',
                r'\btell\s+me\s+about\b',
                r'\bcurrent\s+state\b'
            ],
            "strategy_builder": [
                r'\b(strategy|plan|approach|method)\b.*\b(build|create|develop|design)\b',
                r'\bhelp\s+me\s+(create|build|design)\b',
                r'\bhow\s+(should|can)\s+i\s+(trade|invest)\b',
                r'\bwhat.*strategy\b',
                r'\bstep.*strategy\b',
                r'\bguide\s+me\b'
            ],
            "debate": [
                r'\b(debate|argue|perspectives|opinions|views|sides)\b',
                r'\b(bull|bear)\s+(case|argument)\b',
                r'\b(for\s+and\s+against|pros\s+and\s+cons)\b',
                r'\bdifferent\s+viewpoints?\b',
                r'\bmultiple\s+perspectives?\b'
            ]
        }
    
    def classify_query(self, query: str) -> QueryType:
        """
        Intelligently classify user query to determine the best AI mode
        
        Priority order:
        1. Code Generation (most specific)
        2. Strategy Builder (interactive)
        3. Debate (multi-perspective)
        4. Research (information gathering)
        5. Deep Analysis (complex reasoning)
        6. Standard (default)
        """
        query_lower = query.lower()
        
        # Check each pattern type in priority order
        priority = ["code_generation", "strategy_builder", "debate", "research", "deep_analysis"]
        
        for query_type in priority:
            patterns = self.patterns.get(query_type, [])
            for pattern in patterns:
                if re.search(pattern, query_lower, re.IGNORECASE):
                    logging.info(f"Wellington: Classified as {query_type}")
                    return query_type
        
        # Default to standard for simple queries
        logging.info("Wellington: Using standard mode")
        return "standard"
    
    async def process_query(
        self, 
        user_message: str, 
        context: Dict,
        image_data: Optional[str] = None,
        file_content: Optional[str] = None,
        url_content: Optional[str] = None,
        model: Optional[str] = None
    ) -> Dict:
        """
        Process user query with automatic mode selection
        
        Returns:
        {
            "response": str,
            "mode_used": str,
            "thinking": str (optional - only for advanced modes),
            "metadata": dict
        }
        """
        try:
            # Apply requested Claude model (validated, falls back to default)
            selected_model = resolve_model(model)
            self.standard_ai.model = selected_model
            self.advanced_ai.model = selected_model
            
            # Classify the query
            query_type = self.classify_query(user_message)
            
            handlers = {
                "code_generation": self._handle_code_generation,
                "deep_analysis": self._handle_deep_analysis,
                "research": self._handle_research,
                "strategy_builder": self._handle_strategy_builder,
                "debate": self._handle_debate,
            }
            handler = handlers.get(query_type)
            if handler:
                return await handler(user_message, context)
            
            return await self._handle_standard(
                user_message, context, image_data, file_content, url_content
            )
        
        except Exception as e:
            logging.error(f"Wellington Orchestrator error: {e}")
            return {
                "response": f"Wellington AI Error: {str(e)}",
                "mode_used": "error",
                "error": str(e),
                "metadata": {}
            }
    
    async def _handle_standard(self, user_message: str, context: Dict,
                               image_data: Optional[str] = None,
                               file_content: Optional[str] = None,
                               url_content: Optional[str] = None) -> Dict:
        response = await self.standard_ai.chat_with_wellington(
            user_message, context, image_data, file_content, url_content
        )
        return {
            "response": response,
            "mode_used": "standard",
            "metadata": {"auto_detected": True}
        }
    
    async def _handle_code_generation(self, user_message: str, context: Dict) -> Dict:
        result = await self.advanced_ai.generate_trading_code(
            strategy_description=user_message,
            parameters={
                "instruments": context.get("symbols", ["SPY", "QQQ"]),
                "timeframe": "daily",
                "risk_per_trade": 2,
                "max_positions": 5
            }
        )
        return {
            "response": result.get("explanation", ""),
            "code": result.get("code", ""),
            "mode_used": "code_generation",
            "metadata": {"auto_detected": True}
        }
    
    async def _handle_deep_analysis(self, user_message: str, context: Dict) -> Dict:
        result = await self.advanced_ai.deep_analysis(user_message, context)
        return {
            "response": result.get("answer", result.get("full_response", "")),
            "thinking": result.get("thinking", ""),
            "mode_used": "deep_analysis",
            "metadata": {"auto_detected": True, "confidence_level": "high"}
        }
    
    async def _handle_research(self, user_message: str, context: Dict) -> Dict:
        result = await self.advanced_ai.market_research(user_message, depth="comprehensive")
        return {
            "response": result.get("answer", result.get("full_response", "")),
            "thinking": result.get("thinking", ""),
            "mode_used": "research",
            "metadata": {"auto_detected": True}
        }
    
    async def _handle_strategy_builder(self, user_message: str, context: Dict) -> Dict:
        result = await self.advanced_ai.build_strategy_interactive(
            user_message, 
            conversation_state={"stage": "objectives", "context": context}
        )
        return {
            "response": result.get("response", ""),
            "mode_used": "strategy_builder",
            "next_stage": result.get("next_stage", "objectives"),
            "metadata": {"auto_detected": True, "interactive": True}
        }
    
    async def _handle_debate(self, user_message: str, context: Dict) -> Dict:
        perspectives = ["Bullish Investor", "Bearish Analyst", "Risk Manager"]
        result = await self.advanced_ai.multi_agent_debate(user_message, perspectives)
        
        debate_text = "**Multi-Perspective Analysis**\n\n"
        for perspective, response in result.get("perspectives", {}).items():
            debate_text += f"### {perspective}\n{response}\n\n"
        debate_text += f"### Synthesis\n{result.get('synthesis', '')}"
        
        return {
            "response": debate_text,
            "mode_used": "multi_agent_debate",
            "perspectives": result.get("perspectives", {}),
            "synthesis": result.get("synthesis", ""),
            "metadata": {"auto_detected": True}
        }

# Singleton
_orchestrator = None

def get_wellington_orchestrator(api_key: str = None) -> WellingtonOrchestrator:
    """Get or create Wellington Orchestrator singleton"""
    import os
    global _orchestrator
    if _orchestrator is None:
        if api_key is None:
            api_key = os.environ.get('EMERGENT_LLM_KEY')
        _orchestrator = WellingtonOrchestrator(api_key)
    return _orchestrator
