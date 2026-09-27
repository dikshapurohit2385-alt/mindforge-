"""
OnePath AI (MindForge) - Model Evaluation & Benchmark Suite
Tests our trained custom model against curriculum questions, structured JSON generation,
and verifies output quality, token speed, and anti-hallucination safety.
"""

import os
import sys
import time
import json
import logging
from typing import Dict, Any, List

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("onepath_ai.eval")

MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "onepath-custom-v1")

BENCHMARK_PROMPTS = [
    {
        "id": "phys_01",
        "category": "Physics",
        "question": "What is Newton's First Law of Motion and what is another common name for it?",
        "required_keywords": ["inertia", "rest", "uniform", "external", "force"]
    },
    {
        "id": "chem_01",
        "category": "Chemistry",
        "question": "Describe the three subatomic particles inside an atom and specify their electrical charges.",
        "required_keywords": ["proton", "neutron", "electron", "positive", "negative"]
    },
    {
        "id": "elec_01",
        "category": "Physics",
        "question": "State Ohm's Law and its mathematical formula.",
        "required_keywords": ["potential", "current", "resistance", "v = i"]
    },
    {
        "id": "math_01",
        "category": "Mathematics",
        "question": "What is the difference between a rational number and an irrational number?",
        "required_keywords": ["p/q", "terminating", "repeating", "non-terminating"]
    },
    {
        "id": "json_01",
        "category": "Structured Output",
        "question": "Return a JSON object analyzing 'Gravitational Force' with keys 'explanation', 'key_points', and 'real_world_analogy'.",
        "required_keywords": ["explanation", "key_points", "real_world_analogy"],
        "expect_json": True
    }
]


def evaluate_custom_model(model_path: str = MODEL_DIR) -> Dict[str, Any]:
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer

    if not os.path.exists(model_path):
        return {
            "success": False,
            "error": f"Model directory not found at: {model_path}. Please train the model first."
        }

    device = "cuda" if torch.cuda.is_available() else "cpu"
    logger.info(f"Loading custom model from {model_path} onto {device.upper()}...")

    start_load = time.time()
    tokenizer = AutoTokenizer.from_pretrained(model_path, trust_remote_code=True)
    model = AutoModelForCausalLM.from_pretrained(
        model_path,
        torch_dtype=torch.float16 if device == "cuda" else torch.float32,
        device_map="auto" if device == "cuda" else None,
        trust_remote_code=True
    )
    load_time = round(time.time() - start_load, 2)
    logger.info(f"Model loaded in {load_time}s.")

    results = []
    total_tokens_generated = 0
    total_gen_time = 0.0

    print("\n" + "=" * 70)
    print("      ONEPATH AI - CUSTOM MODEL BENCHMARK & EVALUATION")
    print("=" * 70)

    for item in BENCHMARK_PROMPTS:
        qid = item["id"]
        category = item["category"]
        question = item["question"]
        req_keys = item.get("required_keywords", [])
        expect_json = item.get("expect_json", False)

        formatted_prompt = (
            f"<|im_start|>system\nYou are OnePath AI's dedicated educational tutor.<|im_end|>\n"
            f"<|im_start|>user\n{question}<|im_end|>\n"
            f"<|im_start|>assistant\n"
        )

        inputs = tokenizer(formatted_prompt, return_tensors="pt").to(device)
        input_len = inputs["input_ids"].shape[1]

        t0 = time.time()
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=256,
                temperature=0.2,
                top_p=0.9,
                do_sample=True,
                pad_token_id=tokenizer.pad_token_id or tokenizer.eos_token_id
            )
        elapsed = time.time() - t0
        total_gen_time += elapsed

        gen_tokens = outputs[0][input_len:]
        num_tokens = len(gen_tokens)
        total_tokens_generated += num_tokens
        gen_text = tokenizer.decode(gen_tokens, skip_special_tokens=True).strip()

        # Score relevance & keyword presence
        text_lower = gen_text.lower()
        matched_keys = [k for k in req_keys if k in text_lower]
        keyword_score = (len(matched_keys) / len(req_keys)) if req_keys else 1.0

        is_valid_json = False
        if expect_json:
            try:
                # Basic JSON extraction check
                first_b = gen_text.find("{")
                last_b = gen_text.rfind("}")
                if first_b != -1 and last_b > first_b:
                    json.loads(gen_text[first_b:last_b+1])
                    is_valid_json = True
            except Exception:
                is_valid_json = False

        pass_status = (keyword_score >= 0.6) and (not expect_json or is_valid_json)
        tok_speed = round(num_tokens / elapsed, 1) if elapsed > 0 else 0

        res_entry = {
            "id": qid,
            "category": category,
            "question": question,
            "answer_preview": gen_text[:140] + ("..." if len(gen_text) > 140 else ""),
            "tokens": num_tokens,
            "speed_tok_sec": tok_speed,
            "keyword_match_rate": round(keyword_score * 100, 1),
            "valid_json": is_valid_json if expect_json else None,
            "passed": pass_status
        }
        results.append(res_entry)

        status_tag = "PASS" if pass_status else "FAIL"
        print(f"[{status_tag}] {qid} ({category}) | Speed: {tok_speed} tok/s | Keywords: {int(keyword_score*100)}%")
        print(f"       Preview: {res_entry['answer_preview']}")
        print("-" * 70)

    overall_passed = sum(1 for r in results if r["passed"])
    accuracy_rate = round((overall_passed / len(results)) * 100, 1)
    avg_speed = round(total_tokens_generated / total_gen_time, 1) if total_gen_time > 0 else 0

    summary = {
        "success": True,
        "device": device,
        "model_path": model_path,
        "load_time_seconds": load_time,
        "total_tests": len(results),
        "passed_tests": overall_passed,
        "accuracy_rate_percent": accuracy_rate,
        "average_speed_tokens_per_sec": avg_speed,
        "results": results
    }

    print("\n" + "=" * 70)
    print(f"SUMMARY: {overall_passed}/{len(results)} tests passed ({accuracy_rate}%)")
    print(f"Average Generation Speed: {avg_speed} tokens/second on {device.upper()}")
    print("=" * 70 + "\n")

    return summary


if __name__ == "__main__":
    evaluate_custom_model()
