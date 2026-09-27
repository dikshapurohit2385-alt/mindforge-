"""
Live Integration Verification Script for OnePath AI Custom Model & Groq Fallback
Verifies that the FastAPI application serves queries using our custom model as primary,
and seamlessly switches to Groq fallback when requested or needed.
"""

import sys
import os
import json
from dotenv import load_dotenv

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Ensure backend root is on sys.path and load backend/.env
backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)
load_dotenv(os.path.join(backend_root, ".env"))

from fastapi.testclient import TestClient
from app.main import app
from app.services.custom_model_service import custom_model_service
from app.services.llm_service import llm_service

client = TestClient(app)

print("\n" + "=" * 75)
print("     ONEPATH AI - LIVE SYSTEM & CUSTOM MODEL VERIFICATION")
print("=" * 75)

# 1. Model Status Probe
print("\n[Step 1] Querying /api/v1/model/status...")
resp = client.get("/api/v1/model/status")
print(f"Status Code: {resp.status_code}")
status_data = resp.json()
print("Model Status Response:", json.dumps(status_data, indent=2))
assert resp.status_code == 200
assert status_data["primary_model"]["model_exists_on_disk"] is True
assert status_data["fallback_groq_configured"] is True
print("-> Status probe PASSED!")

# 2. Live Custom Model Query via Primary Engine
print("\n[Step 2] Sending live question to Primary Custom Model via /api/v1/model/test-query...")
query_payload = {
    "prompt": "Explain what an atom is and describe its components.",
    "system_instruction": "You are OnePath AI's educational tutor."
}
resp2 = client.post("/api/v1/model/test-query", json=query_payload)
print(f"Status Code: {resp2.status_code}")
q_data = resp2.json()
print(f"Provider Used: {q_data.get('provider')}")
print("Answer Preview:\n", q_data.get('answer', '')[:300], "...\n")
assert resp2.status_code == 200
assert q_data.get("provider") == "Primary Custom Model"
assert len(q_data.get("answer", "")) > 20
print("-> Live Custom Model Query PASSED!")

# 3. Live Groq Fallback Test
print("\n[Step 3] Testing Groq Fallback mechanism (force_fallback=True)...")
fallback_payload = {
    "prompt": "What is speed and velocity in physics?",
    "force_fallback": True
}
resp3 = client.post("/api/v1/model/test-query", json=fallback_payload)
print(f"Status Code: {resp3.status_code}")
fb_data = resp3.json()
print(f"Provider Used: {fb_data.get('provider')}")
print("Answer Preview:\n", fb_data.get('answer', '')[:300], "...\n")
assert resp3.status_code == 200
assert "Groq Cloud Fallback" in fb_data.get("provider")
assert len(fb_data.get("answer", "")) > 20
print("-> Groq Fallback mechanism PASSED!")

print("\n" + "=" * 75)
print("ALL LIVE VERIFICATIONS PASSED SUCCESSFULLY!")
print("Our custom model is primary, active, and Groq fallback is fully functional.")
print("=" * 75 + "\n")
