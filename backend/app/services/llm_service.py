import os
import json
import re
import logging
from typing import Optional, Dict, Any, List
import httpx
from app.core.config import settings

logger = logging.getLogger("onepath_ai.llm")

class LLMService:
    """
    Unified, resilient LLM service supporting Groq (primary) and Google Gemini (fallback),
    with robust JSON parsing and error diagnostics.
    """

    def __init__(self):
        self.groq_api_key = os.getenv("GROQ_API_KEY", settings.GROQ_API_KEY)
        self.groq_model = os.getenv("GROQ_MODEL", settings.GROQ_MODEL) or "openai/gpt-oss-120b"
        self.gemini_api_key = os.getenv("GEMINI_API_KEY", settings.GEMINI_API_KEY)

    def _refresh_keys(self):
        """Ensure runtime env updates are reflected."""
        self.groq_api_key = os.getenv("GROQ_API_KEY", settings.GROQ_API_KEY)
        self.groq_model = os.getenv("GROQ_MODEL", settings.GROQ_MODEL) or "openai/gpt-oss-120b"
        self.gemini_api_key = os.getenv("GEMINI_API_KEY", settings.GEMINI_API_KEY)

    async def generate_text(
        self,
        prompt: str,
        system_instruction: str = "",
        temperature: float = 0.2,
        max_tokens: int = 1200
    ) -> Optional[str]:
        """
        Generate text completion with provider fallback.
        Tries Groq first (high capacity, no rate limits), then Gemini.
        """
        self._refresh_keys()

        # 1. Try Groq (Primary)
        if self.groq_api_key:
            res = await self._call_groq(
                prompt=prompt,
                system_instruction=system_instruction,
                temperature=temperature,
                max_tokens=max_tokens,
                json_mode=False
            )
            if res:
                return res

        # 2. Try Gemini (Secondary Fallback)
        if self.gemini_api_key:
            res = await self._call_gemini(
                prompt=prompt,
                system_instruction=system_instruction,
                temperature=temperature,
                max_tokens=max_tokens,
                json_mode=False
            )
            if res:
                return res

        return None

    async def generate_json(
        self,
        prompt: str,
        system_instruction: str = "",
        temperature: float = 0.2,
        max_tokens: int = 2000
    ) -> Optional[Any]:
        """
        Generate structured JSON output with automatic parsing and cleanup.
        """
        self._refresh_keys()

        # 1. Try Groq
        if self.groq_api_key:
            res_str = await self._call_groq(
                prompt=prompt,
                system_instruction=system_instruction,
                temperature=temperature,
                max_tokens=max_tokens,
                json_mode=True
            )
            parsed = self._extract_json(res_str)
            if parsed is not None:
                return parsed

        # 2. Try Gemini
        if self.gemini_api_key:
            res_str = await self._call_gemini(
                prompt=prompt,
                system_instruction=system_instruction,
                temperature=temperature,
                max_tokens=max_tokens,
                json_mode=True
            )
            parsed = self._extract_json(res_str)
            if parsed is not None:
                return parsed

        return None

    async def _call_groq(
        self,
        prompt: str,
        system_instruction: str,
        temperature: float,
        max_tokens: int,
        json_mode: bool
    ) -> Optional[str]:
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.groq_api_key}",
            "Content-Type": "application/json"
        }

        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})

        payload: Dict[str, Any] = {
            "model": self.groq_model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.post(url, headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    choices = data.get("choices", [])
                    if choices:
                        return choices[0].get("message", {}).get("content", "").strip()
                else:
                    logger.warning(f"[Groq LLM] HTTP {resp.status_code}: {resp.text}")
                    # If model not found or fallback needed, try lightweight fallback model
                    if resp.status_code == 404 or "model_not_found" in resp.text:
                        payload["model"] = "openai/gpt-oss-20b"
                        retry_resp = await client.post(url, headers=headers, json=payload)
                        if retry_resp.status_code == 200:
                            data = retry_resp.json()
                            choices = data.get("choices", [])
                            if choices:
                                return choices[0].get("message", {}).get("content", "").strip()
        except Exception as e:
            logger.error(f"[Groq LLM] Call exception: {e}")

        return None

    async def _call_gemini(
        self,
        prompt: str,
        system_instruction: str,
        temperature: float,
        max_tokens: int,
        json_mode: bool
    ) -> Optional[str]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.gemini_api_key}"
        combined = f"{system_instruction}\n\n{prompt}".strip() if system_instruction else prompt
        gen_config: Dict[str, Any] = {
            "temperature": temperature,
            "maxOutputTokens": max_tokens
        }
        if json_mode:
            gen_config["response_mime_type"] = "application/json"

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(
                    url,
                    json={
                        "contents": [{"parts": [{"text": combined}]}],
                        "generationConfig": gen_config
                    }
                )
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            return parts[0].get("text", "").strip()
                else:
                    logger.warning(f"[Gemini LLM] HTTP {resp.status_code}: {resp.text}")
        except Exception as e:
            logger.error(f"[Gemini LLM] Call exception: {e}")

        return None

    @staticmethod
    def _extract_json(text: Optional[str]) -> Optional[Any]:
        if not text:
            return None
        text = text.strip()
        # Direct parse attempt
        try:
            return json.loads(text)
        except Exception:
            pass

        # Strip markdown ```json ... ``` wrapper
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
        if match:
            try:
                return json.loads(match.group(1).strip())
            except Exception:
                pass

        # Try to locate { ... } or [ ... ]
        first_curly = text.find("{")
        last_curly = text.rfind("}")
        if first_curly != -1 and last_curly > first_curly:
            try:
                return json.loads(text[first_curly:last_curly + 1])
            except Exception:
                pass

        first_sq = text.find("[")
        last_sq = text.rfind("]")
        if first_sq != -1 and last_sq > first_sq:
            try:
                return json.loads(text[first_sq:last_sq + 1])
            except Exception:
                pass

        return None

llm_service = LLMService()
