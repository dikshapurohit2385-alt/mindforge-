"""
OnePath AI (MindForge) - Model Diagnostic & Status Router
Provides endpoints to monitor model operational status, GPU memory,
and test prompt answering across Primary and Fallback providers.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.core.deps import get_current_user
from app.models.user import User
from app.services.custom_model_service import custom_model_service
from app.services.llm_service import llm_service

router = APIRouter(prefix="/model", tags=["custom-model"])


class ModelTestIn(BaseModel):
    prompt: str
    system_instruction: Optional[str] = "You are OnePath AI's educational tutor."
    force_fallback: Optional[bool] = False


class ModelStatusOut(BaseModel):
    primary_model: Dict[str, Any]
    fallback_groq_configured: bool
    fallback_gemini_configured: bool
    status: str


@router.get("/status", response_model=ModelStatusOut)
def get_model_status():
    info = custom_model_service.get_info()
    return ModelStatusOut(
        primary_model=info,
        fallback_groq_configured=bool(llm_service.groq_api_key),
        fallback_gemini_configured=bool(llm_service.gemini_api_key),
        status="READY (Custom Model Active)" if info.get("is_loaded") or info.get("model_exists_on_disk") else "FALLBACK_MODE (Groq Active)"
    )


@router.post("/test-query")
async def test_model_query(payload: ModelTestIn):
    """Test generating an answer, reporting which engine answered (Local Custom vs Groq Fallback)."""
    if payload.force_fallback:
        # Intentionally test Groq fallback
        if not llm_service.groq_api_key:
            raise HTTPException(status_code=400, detail="Groq API key not configured")
        ans = await llm_service._call_groq(
            prompt=payload.prompt,
            system_instruction=payload.system_instruction,
            temperature=0.2,
            max_tokens=600,
            json_mode=False
        )
        return {
            "provider": "Groq Cloud Fallback (Forced)",
            "answer": ans
        }

    # Normal dispatch: Custom Model -> Groq -> Gemini
    ans = await llm_service.generate_text(
        prompt=payload.prompt,
        system_instruction=payload.system_instruction
    )
    
    provider_used = "Primary Custom Model" if custom_model_service.is_available() else "Groq Fallback"
    return {
        "provider": provider_used,
        "answer": ans
    }
