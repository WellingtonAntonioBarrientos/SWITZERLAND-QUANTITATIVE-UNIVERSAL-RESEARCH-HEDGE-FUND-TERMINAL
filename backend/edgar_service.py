"""SEC EDGAR 13F-HR fetcher: latest filing per fund with ticker mapping"""
import re
import logging
import httpx
import xml.etree.ElementTree as ET

logger = logging.getLogger(__name__)
HEADERS = {"User-Agent": "SQUHF Terminal research barrientoswellingtonantonio@gmail.com"}

_ticker_map = None

_SUFFIX_WORDS = {"INC", "CORP", "CORPORATION", "CO", "COMPANY", "PLC", "LTD", "LLC", "LP", "SA", "NV",
                 "ADR", "COM", "NEW", "DEL", "THE", "CL", "CLASS", "A", "B", "ETF", "TR", "T", "TRUST", "FD", "HOLDINGS", "HLDGS", "GROUP", "GRP",
                 "SER", "SERIES", "UNIT", "UNITS", "SHS", "SH"}

_ABBREV = {"MATLS": "MATERIALS", "FINL": "FINANCIAL", "MGMT": "MANAGEMENT", "MKTS": "MARKETS",
           "PPTY": "PROPERTY", "RLTY": "REALTY", "SYS": "SYSTEMS", "MNG": "MINING",
           "INTL": "INTERNATIONAL", "SVCS": "SERVICES", "LABS": "LABORATORIES", "PES": "PES",
           "STR": "STREET", "PRODS": "PRODUCTS", "CHEMS": "CHEMICALS", "RES": "RESOURCES",
           "ENTMT": "ENTERTAINMENT", "COMMUNS": "COMMUNICATIONS", "TECHNOLOGIE": "TECHNOLOGIES"}

def _norm(name: str) -> str:
    s = re.sub(r"[^A-Z0-9 ]", "", name.upper())
    words = [_ABBREV.get(w, w) for w in s.split()]
    while len(words) > 1 and (words[-1] in _SUFFIX_WORDS or words[-1].isdigit()):
        words.pop()
    return " ".join(words)

async def _load_ticker_map(client) -> dict:
    global _ticker_map
    if _ticker_map is not None:
        return _ticker_map
    r = await client.get("https://www.sec.gov/files/company_tickers.json", headers=HEADERS)
    r.raise_for_status()
    m = {}
    for row in r.json().values():
        key = _norm(row["title"])
        if key and key not in m:
            m[key] = row["ticker"]
    _ticker_map = m
    return m

_ETF_PREFIXES = [
    ("INVESCO QQQ", "QQQ"), ("SPDR SP 500", "SPY"), ("STATE STREET SPDR SP 500", "SPY"), ("STATE STR SPDR SP 500", "SPY"), ("STATE STREET SP 500", "SPY"), ("STATE STREET SP", "SPY"),
    ("ISHARES CORE SP 500", "IVV"), ("ISHARES RUSSELL 2000", "IWM"), ("ISHARES RUSSELL 1000", "IWB"),
    ("ISHARES 20 YR", "TLT"), ("ISHARES 20 YEAR", "TLT"), ("ISHARES 7 10", "IEF"),
    ("ISHARES IBOXX HIGH", "HYG"), ("ISHARES IBOXX INVT", "LQD"), ("ISHARES IBOXX INVESTMENT", "LQD"),
    ("SPDR GOLD", "GLD"), ("ISHARES GOLD", "IAU"), ("ISHARES SILVER", "SLV"),
    ("ISHARES MSCI EMERGING", "EEM"), ("ISHARES CORE MSCI EMERGING", "IEMG"), ("ISHARES MSCI EAFE", "EFA"),
    ("VANGUARD TOT STK", "VTI"), ("VANGUARD TOTAL STOCK", "VTI"), ("VANGUARD SP 500", "VOO"),
    ("ISHARES BITCOIN", "IBIT"), ("ISHARES ETHEREUM", "ETHA"), ("ISHARES CHINA LARGE", "FXI"),
    ("DIREXION DAILY SEMICONDUCTOR BULL", "SOXL"), ("DIREXION DAILY SEMICONDUCTORS BULL", "SOXL"),
    ("FINANCIAL SELECT SECTOR", "XLF"), ("ENERGY SELECT SECTOR", "XLE"), ("TECHNOLOGY SELECT SECTOR", "XLK"),
    ("UTILITIES SELECT SECTOR", "XLU"), ("HEALTH CARE SELECT SECTOR", "XLV"), ("CONSUMER DISCRETIONARY SELECT", "XLY"),
    ("VANECK SEMICONDUCTOR", "SMH"), ("ISHARES MSCI JAPAN", "EWJ"), ("ISHARES NATIONAL MUNI", "MUB"),
]

def _match_ticker(issuer: str, tmap: dict):
    key = _norm(issuer)
    for prefix, ticker in _ETF_PREFIXES:
        if key.startswith(prefix):
            return ticker
    if key in tmap:
        return tmap[key]
    for k, t in tmap.items():
        if key and (k.startswith(key) or key.startswith(k)) and abs(len(k) - len(key)) <= 6:
            return t
    if len(key) >= 8:
        for k, t in tmap.items():
            if len(k) >= 8 and (k in key or key in k):
                return t
    return None

async def fetch_latest_13f(cik: str, expected_name: str):
    """Return latest 13F-HR holdings for a CIK, or None on any failure"""
    cik10 = str(int(cik)).zfill(10)
    async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
        r = await client.get(f"https://data.sec.gov/submissions/CIK{cik10}.json", headers=HEADERS)
        if r.status_code != 200:
            return None
        sub = r.json()
        entity = sub.get("name", "")
        recent = sub.get("filings", {}).get("recent", {})
        forms = recent.get("form", [])
        idx = next((i for i, f in enumerate(forms) if f == "13F-HR"), None)
        if idx is None:
            return None
        accession = recent["accessionNumber"][idx]
        filing_date = recent["filingDate"][idx]
        report_date = recent.get("reportDate", [""] * len(forms))[idx] or filing_date
        acc_nodash = accession.replace("-", "")
        base = f"https://www.sec.gov/Archives/edgar/data/{int(cik)}/{acc_nodash}"
        r = await client.get(f"{base}/index.json", headers=HEADERS)
        if r.status_code != 200:
            return None
        files = [f["name"] for f in r.json().get("directory", {}).get("item", [])]
        xmls = [f for f in files if f.lower().endswith(".xml") and "primary_doc" not in f.lower()]
        info = next((f for f in xmls if "infotable" in f.lower() or "info_table" in f.lower() or "form13f" in f.lower()), xmls[0] if xmls else None)
        if not info:
            return None
        r = await client.get(f"{base}/{info}", headers=HEADERS)
        if r.status_code != 200:
            return None
        tmap = await _load_ticker_map(client)
    
    try:
        root = ET.fromstring(r.content)
    except ET.ParseError:
        return None
    
    def local(tag):
        return tag.split("}")[-1].lower()
    
    agg = {}
    for el in root.iter():
        if local(el.tag) == "infotable":
            issuer, value, shares = None, 0.0, 0
            for ch in el.iter():
                lt = local(ch.tag)
                if lt == "nameofissuer":
                    issuer = (ch.text or "").strip()
                elif lt == "value":
                    try:
                        value = float(ch.text or 0)
                    except ValueError:
                        value = 0
                elif lt == "sshprnamt":
                    try:
                        shares = int(float(ch.text or 0))
                    except ValueError:
                        shares = 0
            if issuer:
                a = agg.setdefault(issuer, {"value": 0.0, "shares": 0})
                a["value"] += value
                a["shares"] += shares
    if not agg:
        return None
    
    total = sum(a["value"] for a in agg.values())
    top = sorted(agg.items(), key=lambda kv: kv[1]["value"], reverse=True)[:60]
    by_symbol = {}
    for issuer, a in top:
        ticker = _match_ticker(issuer, _ticker_map or {}) or _norm(issuer).replace(" ", "-")[:12]
        cur = by_symbol.setdefault(ticker, {"symbol": ticker, "name": issuer.title(), "value": 0, "shares": 0, "change": 0.0})
        cur["value"] += int(a["value"])
        cur["shares"] += a["shares"]
    holdings = sorted(by_symbol.values(), key=lambda h: h["value"], reverse=True)[:50]
    for h in holdings:
        h["percent"] = round(h["value"] / total * 100, 4)
    
    y, m = int(report_date[:4]), int(report_date[5:7])
    quarter = f"Q{(m - 1) // 3 + 1} {y}"
    return {"entity": entity, "accession": accession, "filing_date": filing_date,
            "quarter": quarter, "aum": int(total), "top_holdings": holdings}
