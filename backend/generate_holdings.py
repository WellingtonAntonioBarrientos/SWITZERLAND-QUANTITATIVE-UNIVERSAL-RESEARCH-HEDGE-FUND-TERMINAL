#!/usr/bin/env python3
"""Generate 50 holdings for each of the 10 hedge funds"""

import random

# Extended stock pool (55 stocks)
STOCK_POOL = [
    # Tech Giants & Semiconductors
    ("AAPL", "Apple Inc."), ("MSFT", "Microsoft Corp"), ("GOOGL", "Alphabet Inc Class A"),
    ("AMZN", "Amazon.com Inc"), ("META", "Meta Platforms Inc"), ("NVDA", "NVIDIA Corp"),
    ("TSLA", "Tesla Inc"), ("AMD", "Advanced Micro Devices Inc"), ("AVGO", "Broadcom Inc"),
    ("ASML", "ASML Holding NV ADR"), ("TXN", "Texas Instruments Inc"), ("QCOM", "Qualcomm Inc"),
    ("INTC", "Intel Corp"), ("AMAT", "Applied Materials Inc"), ("LRCX", "Lam Research Corp"),
    
    # Healthcare & Biotech
    ("JNJ", "Johnson & Johnson"), ("UNH", "UnitedHealth Group Inc"), ("LLY", "Eli Lilly and Co"),
    ("ABBV", "AbbVie Inc"), ("MRK", "Merck & Co Inc"), ("ABT", "Abbott Laboratories"),
    ("TMO", "Thermo Fisher Scientific Inc"), ("PFE", "Pfizer Inc"), ("NOVO", "Novo Nordisk A/S ADR"),
    ("REGN", "Regeneron Pharmaceuticals Inc"), ("VRTX", "Vertex Pharmaceuticals Inc"), ("GILD", "Gilead Sciences Inc"),
    
    # Financials
    ("JPM", "JPMorgan Chase & Co"), ("BAC", "Bank of America Corp"), ("V", "Visa Inc"),
    ("MA", "Mastercard Inc"), ("WFC", "Wells Fargo & Co"), ("GS", "Goldman Sachs Group Inc"),
    ("MS", "Morgan Stanley"), ("BLK", "BlackRock Inc"), ("C", "Citigroup Inc"),
    
    # Consumer & Retail
    ("WMT", "Walmart Inc"), ("PG", "Procter & Gamble Co"), ("KO", "Coca-Cola Co"),
    ("PEP", "PepsiCo Inc"), ("COST", "Costco Wholesale Corp"), ("HD", "Home Depot Inc"),
    ("NKE", "Nike Inc"), ("MCD", "McDonald's Corp"), ("SBUX", "Starbucks Corp"),
    ("LOW", "Lowe's Companies Inc"), ("TGT", "Target Corp"),
    
    # Others - Industrials, Energy, Communication
    ("DIS", "Walt Disney Co"), ("NFLX", "Netflix Inc"), ("CRM", "Salesforce Inc"),
    ("ADBE", "Adobe Inc"), ("CSCO", "Cisco Systems Inc"), ("ORCL", "Oracle Corp"),
]

# ETFs
ETFS = [
    ("SPY", "SPDR S&P 500 ETF"), ("IVV", "iShares Core S&P 500 ETF"), ("QQQ", "Invesco QQQ Trust"),
    ("VWO", "Vanguard FTSE Emerging Markets ETF"), ("GLD", "SPDR Gold Trust"),
    ("IEMG", "iShares Core MSCI Emerging Markets ETF"), ("AGG", "iShares Core US Aggregate Bond ETF"),
    ("VTI", "Vanguard Total Stock Market ETF"), ("EEM", "iShares MSCI Emerging Markets ETF"),
]

def generate_50_holdings(fund_aum, fund_bias="balanced"):
    """Generate 50 diverse holdings for a fund"""
    
    # Select stocks based on fund bias
    if fund_bias == "tech-heavy":
        selected_stocks = STOCK_POOL[:20] + random.sample(STOCK_POOL[20:], 25) + random.sample(ETFS, 5)
    elif fund_bias == "healthcare":
        selected_stocks = STOCK_POOL[15:28] + random.sample(STOCK_POOL[:15], 15) + random.sample(STOCK_POOL[28:], 15) + random.sample(ETFS, 5)
    elif fund_bias == "etf-focused":
        selected_stocks = ETFS + random.sample(STOCK_POOL, 41)
    else:
        # Balanced mix
        selected_stocks = random.sample(STOCK_POOL, 45) + random.sample(ETFS, 5)
    
    # Shuffle to create variety
    random.shuffle(selected_stocks)
    selected_stocks = selected_stocks[:50]
    
    holdings = []
    remaining_percent = 100.0
    
    for i, (symbol, name) in enumerate(selected_stocks):
        if i < 49:
            # Logarithmic distribution for realistic portfolio weights
            if i == 0:
                percent = random.uniform(5.0, 8.5)
            elif i < 5:
                percent = random.uniform(1.0, 3.0)
            elif i < 10:
                percent = random.uniform(0.5, 1.5)
            elif i < 20:
                percent = random.uniform(0.1, 0.5)
            elif i < 35:
                percent = random.uniform(0.01, 0.1)
            else:
                percent = random.uniform(0.001, 0.01)
            
            percent = min(percent, remaining_percent - (50 - i) * 0.0001)
            remaining_percent -= percent
        else:
            percent = remaining_percent
        
        value = int(fund_aum * (percent / 100))
        
        # Calculate shares based on rough stock price estimation
        if "ETF" in name or symbol in ["SPY", "IVV", "QQQ", "GLD"]:
            avg_price = random.uniform(150, 550)
        elif symbol in ["NVDA", "TSLA", "META", "GOOGL", "AMZN"]:
            avg_price = random.uniform(200, 1300)
        elif symbol in ["AAPL", "MSFT"]:
            avg_price = random.uniform(150, 450)
        else:
            avg_price = random.uniform(50, 350)
        
        shares = int(value / avg_price)
        change = round(random.uniform(-5.0, 12.0), 1)
        
        holdings.append({
            "symbol": symbol,
            "name": name,
            "value": value,
            "shares": shares,
            "percent": round(percent, 4),
            "change": change
        })
    
    return holdings

# Test generation for Citadel
random.seed(42)  # For reproducibility
holdings = generate_50_holdings(87_600_000_000, "balanced")
print(f"Generated {len(holdings)} holdings")
print(f"Top 5 holdings:")
for i, h in enumerate(holdings[:5]):
    print(f"  {i+1}. {h['symbol']}: ${h['value']/1e9:.2f}B ({h['percent']:.2f}%)")
print(f"\nTotal allocation: {sum(h['percent'] for h in holdings):.2f}%")
