"""
OnePath AI (MindForge) - Custom Model Service
Manages local model loading, GPU/CPU inference, prompt templating, and health status.
Serves as the PRIMARY AI engine before falling back to Groq / Gemini cloud APIs.
"""

import os
import json
import time
import logging
import asyncio
from typing import Optional, Dict, Any, List
from app.core.config import settings

logger = logging.getLogger("onepath_ai.custom_model")


class CustomModelService:
    def __init__(self):
        self.model_path = getattr(settings, "LOCAL_MODEL_PATH", "ml/models/onepath-custom-v1")
        # Resolve absolute path relative to backend root
        if not os.path.isabs(self.model_path):
            backend_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            self.model_path = os.path.join(backend_root, self.model_path)

        self.enabled = getattr(settings, "ENABLE_LOCAL_MODEL", True)
        self.timeout = getattr(settings, "LOCAL_MODEL_TIMEOUT_SECONDS", 12.0)
        self.device = "cuda" if getattr(settings, "LOCAL_MODEL_DEVICE", "cuda") == "cuda" else "cpu"

        self._model = None
        self._tokenizer = None
        self._is_loaded = False
        self._load_error = None
        self._loading_lock = asyncio.Lock()

    def is_available(self) -> bool:
        """Returns True if the local model exists and is ready for inference."""
        if not self.enabled:
            return False
        if self._is_loaded and self._model is not None:
            return True
        return os.path.exists(self.model_path) and os.path.exists(os.path.join(self.model_path, "config.json"))

    def get_info(self) -> Dict[str, Any]:
        """Provides status and device info for administration & diagnostics."""
        return {
            "enabled": self.enabled,
            "model_path": self.model_path,
            "model_exists_on_disk": os.path.exists(self.model_path),
            "is_loaded": self._is_loaded,
            "device": self.device,
            "timeout_seconds": self.timeout,
            "load_error": self._load_error
        }

    async def _ensure_loaded(self) -> bool:
        """Lazy loader that initializes model in memory on first call."""
        if self._is_loaded and self._model is not None:
            return True

        async with self._loading_lock:
            if self._is_loaded and self._model is not None:
                return True

            if not os.path.exists(self.model_path):
                self._load_error = f"Model folder not found at: {self.model_path}"
                return False

            try:
                loop = asyncio.get_running_loop()
                await loop.run_in_executor(None, self._sync_load)
                self._is_loaded = True
                self._load_error = None
                return True
            except Exception as e:
                self._load_error = str(e)
                logger.error(f"[CustomModelService] Load failed: {e}")
                return False

    def _sync_load(self):
        import torch
        from transformers import AutoModelForCausalLM, AutoTokenizer

        device_to_use = "cuda" if (self.device == "cuda" and torch.cuda.is_available()) else "cpu"
        self.device = device_to_use
        logger.info(f"[CustomModelService] Loading custom model from '{self.model_path}' onto {self.device}...")

        self._tokenizer = AutoTokenizer.from_pretrained(self.model_path, trust_remote_code=True)
        self._model = AutoModelForCausalLM.from_pretrained(
            self.model_path,
            torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
            device_map="auto" if self.device == "cuda" else None,
            trust_remote_code=True
        )
        logger.info(f"[CustomModelService] Model successfully loaded onto {self.device}!")

    def _format_chatml(self, prompt: str, system_instruction: str = "") -> str:
        sys_msg = system_instruction or "You are OnePath AI's dedicated educational AI tutor."
        return (
            f"<|im_start|>system\n{sys_msg}<|im_end|>\n"
            f"<|im_start|>user\n{prompt}<|im_end|>\n"
            f"<|im_start|>assistant\n"
        )

    async def generate_text(
        self,
        prompt: str,
        system_instruction: str = "",
        temperature: float = 0.2,
        max_tokens: int = 600
    ) -> Optional[str]:
        """Generate text using our custom model. Times out gracefully to allow fallback."""
        if not self.enabled:
            return None

        if not await self._ensure_loaded():
            return None

        try:
            return await asyncio.wait_for(
                self._run_inference(prompt, system_instruction, temperature, max_tokens),
                timeout=self.timeout
            )
        except asyncio.TimeoutError:
            logger.warning(f"[CustomModelService] Inference timed out after {self.timeout}s. Tripping fallback.")
            return None
        except Exception as e:
            logger.error(f"[CustomModelService] Inference failed: {e}")
            return None

    async def _run_inference(
        self,
        prompt: str,
        system_instruction: str,
        temperature: float,
        max_tokens: int
    ) -> Optional[str]:
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(
            None,
            self._sync_generate,
            prompt,
            system_instruction,
            temperature,
            max_tokens
        )

    def _sync_generate(
        self,
        prompt: str,
        system_instruction: str,
        temperature: float,
        max_tokens: int
    ) -> Optional[str]:
        import torch

        formatted = self._format_chatml(prompt, system_instruction)
        inputs = self._tokenizer(formatted, return_tensors="pt").to(self.device)
        input_len = inputs["input_ids"].shape[1]

        with torch.no_grad():
            outputs = self._model.generate(
                **inputs,
                max_new_tokens=max_tokens,
                temperature=max(0.05, temperature),
                top_p=0.9,
                do_sample=True,
                pad_token_id=self._tokenizer.pad_token_id or self._tokenizer.eos_token_id
            )

        gen_tokens = outputs[0][input_len:]
        text = self._tokenizer.decode(gen_tokens, skip_special_tokens=True).strip()
        # Clean any trailing ChatML end tags
        text = text.replace("<|im_end|>", "").strip()
        return text if text else None

    async def generate_json(
        self,
        prompt: str,
        system_instruction: str = "",
        temperature: float = 0.2,
        max_tokens: int = 1000
    ) -> Optional[Any]:
        """Generate structured JSON using our custom model."""
        json_instruction = (
            f"{system_instruction}\n"
            "CRITICAL: Respond ONLY with a valid, parseable JSON object. "
            "Do NOT include markdown formatting or conversational filler."
        ).strip()

        raw_text = await self.generate_text(
            prompt=prompt,
            system_instruction=json_instruction,
            temperature=temperature,
            max_tokens=max_tokens
        )
        if not raw_text:
            return None

        # Clean JSON parsing
        try:
            return json.loads(raw_text)
        except Exception:
            pass

        # Try regex extract
        import re
        first_curly = raw_text.find("{")
        last_curly = raw_text.rfind("}")
        if first_curly != -1 and last_curly > first_curly:
            try:
                return json.loads(raw_text[first_curly:last_curly + 1])
            except Exception:
                pass

        first_sq = raw_text.find("[")
        last_sq = raw_text.rfind("]")
        if first_sq != -1 and last_sq > first_sq:
            try:
                return json.loads(raw_text[first_sq:last_sq + 1])
            except Exception:
                pass

        return None


custom_model_service = CustomModelService()
