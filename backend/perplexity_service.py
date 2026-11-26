"""Perplexity Sonar adapter: live web-search chat with citations (SSE-compatible)"""
import json
import os
import logging
from typing import AsyncIterator, Dict

import httpx

PPLX_URL = "https://api.perplexity.ai/chat/completions"
PERPLEXITY_MODELS = {"sonar", "sonar-pro", "sonar-reasoning-pro"}

SYSTEM_PROMPT = (
    "You are Wellington AI, the quantitative research assistant of the Switzerland Quantitative "
    "Universal Hedge Fund Terminal. Answer with current, web-sourced market intelligence. "
    "Be concise, cite facts, use trader-friendly language, and never give guaranteed-return promises."
)


def _key() -> str | None:
    return os.environ.get("PERPLEXITY_API_KEY")


def is_configured() -> bool:
    return bool(_key())


def _build_messages(message: str, context: Dict) -> list:
    sys = SYSTEM_PROMPT
    if context:
        sys += (f" User's paper account value: ${context.get('account_value', 0):,.0f} "
                f"with {context.get('positions_count', 0)} positions.")
    return [{"role": "system", "content": sys}, {"role": "user", "content": message}]


def _extract_citations(data: dict) -> list:
    out, seen = [], set()
    for item in data.get("search_results") or []:
        url = item.get("url")
        if url and url.startswith("http") and url not in seen:
            seen.add(url)
            out.append({"url": url, "title": item.get("title")})
    for url in data.get("citations") or []:
        if url and url.startswith("http") and url not in seen:
            seen.add(url)
            out.append({"url": url, "title": None})
    return out


async def ask_perplexity(message: str, context: Dict, model: str = "sonar") -> dict:
    """Non-streaming completion; returns {response, citations}"""
    async with httpx.AsyncClient(timeout=90) as client:
        r = await client.post(PPLX_URL, headers={"Authorization": f"Bearer {_key()}"},
                              json={"model": model, "messages": _build_messages(message, context)})
        r.raise_for_status()
        data = r.json()
    return {"response": data["choices"][0]["message"]["content"] or "",
            "citations": _extract_citations(data)}


async def stream_perplexity(message: str, context: Dict, model: str = "sonar") -> AsyncIterator[dict]:
    """Yields {type: delta, content} chunks then a final {type: citations, citations}"""
    citations: list = []
    async with httpx.AsyncClient(timeout=120) as client:
        async with client.stream("POST", PPLX_URL, headers={"Authorization": f"Bearer {_key()}"},
                                 json={"model": model, "stream": True,
                                       "messages": _build_messages(message, context)}) as resp:
            if resp.status_code != 200:
                body = await resp.aread()
                logging.warning(f"Perplexity stream HTTP {resp.status_code}: {body[:200]}")
                raise RuntimeError(f"Perplexity API error (HTTP {resp.status_code})")
            buffer = ""
            async for chunk in resp.aiter_text():
                buffer += chunk
                while "\n\n" in buffer:
                    frame, buffer = buffer.split("\n\n", 1)
                    for line in frame.splitlines():
                        if not line.startswith("data: "):
                            continue
                        payload = line[6:].strip()
                        if payload == "[DONE]":
                            continue
                        try:
                            data = json.loads(payload)
                        except json.JSONDecodeError:
                            continue
                        choices = data.get("choices") or []
                        if choices:
                            delta = (choices[0].get("delta") or {}).get("content") or ""
                            if delta:
                                yield {"type": "delta", "content": delta}
                        for c in _extract_citations(data):
                            if c not in citations:
                                citations.append(c)
    yield {"type": "citations", "citations": citations}
