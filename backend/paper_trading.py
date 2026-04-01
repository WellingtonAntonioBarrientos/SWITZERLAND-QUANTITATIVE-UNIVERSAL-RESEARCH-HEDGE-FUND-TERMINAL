# Paper Trading System - Virtual Trading Simulator
from datetime import datetime, timezone
from typing import List, Dict, Optional
from pydantic import BaseModel

# Initial virtual capital
INITIAL_CAPITAL = 100_000_000  # $100 Million

class PaperPosition(BaseModel):
    symbol: str
    name: str
    quantity: int
    avg_cost: float
    current_price: float
    total_value: float
    unrealized_pl: float
    unrealized_pl_percent: float
    hedge_fund: str

class PaperOrder(BaseModel):
    order_id: str
    symbol: str
    name: str
    order_type: str  # 'MARKET' or 'LIMIT'
    side: str  # 'BUY' or 'SELL'
    quantity: int
    price: Optional[float] = None  # For limit orders
    status: str  # 'PENDING', 'FILLED', 'CANCELLED'
    filled_price: Optional[float] = None
    timestamp: str
    hedge_fund: str

class PaperAccount(BaseModel):
    user_id: str
    cash_balance: float
    initial_capital: float
    total_value: float
    buying_power: float
    total_pl: float
    total_pl_percent: float
    positions: List[PaperPosition] = []
    order_history: List[PaperOrder] = []
    created_at: str
    updated_at: str

def create_default_account(user_id: str) -> Dict:
    """Create a new paper trading account with $100M"""
    now = datetime.now(timezone.utc).isoformat()
    return {
        "user_id": user_id,
        "cash_balance": INITIAL_CAPITAL,
        "initial_capital": INITIAL_CAPITAL,
        "total_value": INITIAL_CAPITAL,
        "buying_power": INITIAL_CAPITAL,
        "total_pl": 0.0,
        "total_pl_percent": 0.0,
        "positions": [],
        "order_history": [],
        "created_at": now,
        "updated_at": now
    }

def calculate_account_value(positions: List[Dict], cash_balance: float) -> tuple:
    """Calculate total account value and P&L"""
    positions_value = sum(p["total_value"] for p in positions)
    total_value = cash_balance + positions_value
    total_pl = sum(p["unrealized_pl"] for p in positions)
    return total_value, total_pl

def execute_market_order(account: Dict, order: Dict, current_price: float) -> Dict:
    """Execute a market order immediately"""
    symbol = order["symbol"]
    side = order["side"]
    quantity = order["quantity"]
    
    if side == "BUY":
        total_cost = quantity * current_price
        if total_cost > account["cash_balance"]:
            raise ValueError("Insufficient buying power")
        
        account["cash_balance"] -= total_cost
        
        # Find existing position or create new one
        existing_pos = next((p for p in account["positions"] if p["symbol"] == symbol), None)
        if existing_pos:
            # Average cost calculation
            total_shares = existing_pos["quantity"] + quantity
            total_cost_basis = (existing_pos["quantity"] * existing_pos["avg_cost"]) + (quantity * current_price)
            existing_pos["quantity"] = total_shares
            existing_pos["avg_cost"] = total_cost_basis / total_shares
        else:
            # Create new position
            account["positions"].append({
                "symbol": symbol,
                "name": order["name"],
                "quantity": quantity,
                "avg_cost": current_price,
                "hedge_fund": order["hedge_fund"]
            })
    
    elif side == "SELL":
        existing_pos = next((p for p in account["positions"] if p["symbol"] == symbol), None)
        if not existing_pos or existing_pos["quantity"] < quantity:
            raise ValueError("Insufficient shares to sell")
        
        proceeds = quantity * current_price
        account["cash_balance"] += proceeds
        
        existing_pos["quantity"] -= quantity
        if existing_pos["quantity"] == 0:
            account["positions"].remove(existing_pos)
    
    # Mark order as filled
    order["status"] = "FILLED"
    order["filled_price"] = current_price
    account["order_history"].append(order)
    account["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    return account

def update_positions_prices(positions: List[Dict], price_data: Dict[str, float]) -> List[Dict]:
    """Update position values with current market prices"""
    updated_positions = []
    for pos in positions:
        current_price = price_data.get(pos["symbol"], pos["avg_cost"])
        total_value = pos["quantity"] * current_price
        unrealized_pl = (current_price - pos["avg_cost"]) * pos["quantity"]
        unrealized_pl_percent = ((current_price - pos["avg_cost"]) / pos["avg_cost"]) * 100
        
        updated_positions.append({
            **pos,
            "current_price": current_price,
            "total_value": total_value,
            "unrealized_pl": unrealized_pl,
            "unrealized_pl_percent": unrealized_pl_percent
        })
    
    return updated_positions
