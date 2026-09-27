"""
Diagnostic script to test Google Gemini API Key validity, quotas, and model access.
Usage:
    python test_gemini_key.py
    python test_gemini_key.py YOUR_API_KEY
"""

import sys
import os
import json
import httpx
from dotenv import load_dotenv

# Load .env from backend directory
load_dotenv()

def test_key(api_key: str):
    masked = api_key[:6] + "..." + api_key[-4:] if len(api_key) > 10 else "***"
    print(f"\n==========================================")
    print(f" Testing Gemini API Key: {masked}")
    print(f"==========================================\n")

    # Step 1: List Models
    print("[1/3] Checking Key Validity & Listing Available Models...")
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(url)
            print(f"Status Code: {resp.status_code}")
            if resp.status_code == 200:
                models = resp.json().get("models", [])
                model_names = [m.get("name", "").replace("models/", "") for m in models]
                flash_models = [m for m in model_names if "flash" in m]
                print(f"[OK] Key is ACTIVE and VALID! Found {len(models)} models.")
                print(f"Available Flash models: {flash_models[:5]}")
            else:
                print(f"[FAIL] Error validating key: HTTP {resp.status_code}")
                try:
                    err_json = resp.json()
                    print(json.dumps(err_json, indent=2))
                except Exception:
                    print(resp.text)
                return
    except Exception as e:
        print(f"[FAIL] Network/Connection error: {e}")
        return

    # Step 2: Test gemini-1.5-flash generateContent
    print("\n[2/3] Testing Text Generation (gemini-1.5-flash)...")
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        with httpx.Client(timeout=15.0) as client:
            payload = {
                "contents": [{"parts": [{"text": "Hello, respond with exactly: MindForge AI Online!"}]}]
            }
            resp = client.post(url, json=payload)
            print(f"Status Code: {resp.status_code}")
            if resp.status_code == 200:
                data = resp.json()
                text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "").strip()
                print(f"[OK] Generation Success! Response: \"{text}\"")
            else:
                print(f"[FAIL] Generation failed: HTTP {resp.status_code}")
                try:
                    err = resp.json()
                    print(json.dumps(err, indent=2))
                except Exception:
                    print(resp.text)
    except Exception as e:
        print(f"[FAIL] Generation call failed: {e}")

    # Step 3: Test text-embedding-004
    print("\n[3/3] Testing Embedding (text-embedding-004 for RAG)...")
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={api_key}"
        with httpx.Client(timeout=10.0) as client:
            payload = {
                "model": "models/text-embedding-004",
                "content": {"parts": [{"text": "Education vector test"}]}
            }
            resp = client.post(url, json=payload)
            print(f"Status Code: {resp.status_code}")
            if resp.status_code == 200:
                values = resp.json().get("embedding", {}).get("values", [])
                print(f"[OK] Embedding Success! Vector dimension: {len(values)}")
            else:
                print(f"[FAIL] Embedding failed: HTTP {resp.status_code}")
                try:
                    err = resp.json()
                    print(json.dumps(err, indent=2))
                except Exception:
                    print(resp.text)
    except Exception as e:
        print(f"[FAIL] Embedding call failed: {e}")

    print("\n==========================================")
    print(" Diagnostic Complete")
    print("==========================================\n")

if __name__ == "__main__":
    key = None
    if len(sys.argv) > 1 and sys.argv[1].strip():
        key = sys.argv[1].strip()
    else:
        key = os.getenv("GEMINI_API_KEY")

    if not key:
        print("\n[!] No GEMINI_API_KEY found.")
        print("Please provide it as a command line argument or set it in backend/.env:")
        print("  python test_gemini_key.py AIzaSy...\n")
        sys.exit(1)

    test_key(key)
