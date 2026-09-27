"""
OnePath AI (MindForge) - Model Fine-Tuning Pipeline
Trains / fine-tunes our custom educational model using LoRA (Low-Rank Adaptation)
and Hugging Face Transformers with PyTorch CUDA acceleration.
"""

import os
import sys
import json
import argparse
import logging
from typing import List, Dict, Any

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("onepath_ai.training")

DEFAULT_DATA_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "train.jsonl")
DEFAULT_VAL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "val.jsonl")
DEFAULT_OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "onepath-custom-v1")


def load_jsonl(path: str) -> List[Dict[str, Any]]:
    if not os.path.exists(path):
        raise FileNotFoundError(f"Dataset file not found at: {path}")
    data = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                data.append(json.loads(line))
    return data


def format_instruction(sample: Dict[str, Any]) -> str:
    """Format a sample into a standard ChatML instruction prompt."""
    system = sample.get("system", "You are an expert educational AI tutor.")
    instruction = sample.get("instruction", "")
    user_input = sample.get("input", "")
    output = sample.get("output", "")

    user_content = f"{instruction}\n\nContext:\n{user_input}".strip() if user_input else instruction

    formatted = (
        f"<|im_start|>system\n{system}<|im_end|>\n"
        f"<|im_start|>user\n{user_content}<|im_end|>\n"
        f"<|im_start|>assistant\n{output}<|im_end|>"
    )
    return formatted


def train(
    base_model_name: str = "Qwen/Qwen2.5-0.5B-Instruct",
    train_data_path: str = DEFAULT_DATA_PATH,
    val_data_path: str = DEFAULT_VAL_PATH,
    output_dir: str = DEFAULT_OUTPUT_DIR,
    epochs: int = 3,
    batch_size: int = 2,
    gradient_accumulation_steps: int = 4,
    learning_rate: float = 2e-4,
    max_length: int = 512,
    use_lora: bool = True
):
    import torch
    from transformers import (
        AutoModelForCausalLM,
        AutoTokenizer,
        TrainingArguments,
        Trainer,
        DataCollatorForSeq2Seq
    )
    from datasets import Dataset

    device = "cuda" if torch.cuda.is_available() else "cpu"
    logger.info(f"Using compute device: {device.upper()}")
    if device == "cuda":
        logger.info(f"GPU: {torch.cuda.get_device_name(0)}")
        logger.info(f"Initial VRAM Allocated: {torch.cuda.memory_allocated(0)/(1024**2):.2f} MB")

    # 1. Load Datasets
    logger.info(f"Loading training data from {train_data_path}...")
    train_samples = load_jsonl(train_data_path)
    val_samples = load_jsonl(val_data_path) if os.path.exists(val_data_path) else []
    logger.info(f"Loaded {len(train_samples)} training samples, {len(val_samples)} validation samples.")

    train_texts = [format_instruction(s) for s in train_samples]
    val_texts = [format_instruction(s) for s in val_samples] if val_samples else train_texts[:2]

    train_dataset = Dataset.from_dict({"text": train_texts})
    val_dataset = Dataset.from_dict({"text": val_texts})

    # 2. Load Tokenizer & Base Model
    logger.info(f"Loading base model and tokenizer: {base_model_name}...")
    tokenizer = AutoTokenizer.from_pretrained(base_model_name, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    def tokenize_fn(examples):
        tokens = tokenizer(
            examples["text"],
            truncation=True,
            max_length=max_length,
            padding="max_length"
        )
        tokens["labels"] = tokens["input_ids"].copy()
        return tokens

    logger.info("Tokenizing datasets...")
    tokenized_train = train_dataset.map(tokenize_fn, batched=True, remove_columns=["text"])
    tokenized_val = val_dataset.map(tokenize_fn, batched=True, remove_columns=["text"])

    torch_dtype = torch.float16 if device == "cuda" else torch.float32

    logger.info(f"Instantiating model ({torch_dtype})...")
    model = AutoModelForCausalLM.from_pretrained(
        base_model_name,
        torch_dtype=torch_dtype,
        device_map="auto" if device == "cuda" else None,
        trust_remote_code=True
    )

    # 3. Apply LoRA (Parameter Efficient Fine-Tuning)
    if use_lora:
        try:
            from peft import LoraConfig, get_peft_model, TaskType
            logger.info("Configuring LoRA adapter...")
            lora_config = LoraConfig(
                r=16,
                lora_alpha=32,
                target_modules=["q_proj", "v_proj", "k_proj", "o_proj"],
                lora_dropout=0.05,
                bias="none",
                task_type=TaskType.CAUSAL_LM
            )
            model = get_peft_model(model, lora_config)
            trainable_params, all_param = model.get_nb_trainable_parameters()
            logger.info(
                f"LoRA Trainable params: {trainable_params:,} / {all_param:,} "
                f"({100 * trainable_params / all_param:.2f}% active)"
            )
        except ImportError:
            logger.warning("PEFT not installed. Proceeding with full parameters fine-tuning on top layers.")

    # 4. Training Arguments
    os.makedirs(output_dir, exist_ok=True)
    training_args = TrainingArguments(
        output_dir=os.path.join(output_dir, "checkpoints"),
        per_device_train_batch_size=batch_size,
        gradient_accumulation_steps=gradient_accumulation_steps,
        learning_rate=learning_rate,
        num_train_epochs=epochs,
        logging_steps=5,
        save_strategy="epoch",
        eval_strategy="epoch" if val_samples else "no",
        fp16=(device == "cuda"),
        report_to="none",
        warmup_steps=2,
        weight_decay=0.01,
        dataloader_num_workers=0
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_train,
        eval_dataset=tokenized_val if val_samples else None,
        data_collator=DataCollatorForSeq2Seq(tokenizer, pad_to_multiple_of=8, return_tensors="pt")
    )

    # 5. Execute Training Loop
    logger.info("Starting training loop...")
    train_result = trainer.train()
    logger.info(f"Training completed successfully! Global loss: {train_result.training_loss:.4f}")

    # 6. Save Model and Tokenizer
    logger.info(f"Saving final trained model to {output_dir}...")
    if use_lora and hasattr(model, "merge_and_unload"):
        try:
            logger.info("Merging LoRA adapter weights into base model for standalone inference...")
            merged_model = model.merge_and_unload()
            merged_model.save_pretrained(output_dir)
        except Exception as e:
            logger.warning(f"Could not merge LoRA weights directly ({e}). Saving adapter directly.")
            model.save_pretrained(output_dir)
    else:
        model.save_pretrained(output_dir)
    tokenizer.save_pretrained(output_dir)

    # Save training metadata
    meta = {
        "base_model": base_model_name,
        "epochs": epochs,
        "train_loss": train_result.training_loss,
        "device": device,
        "samples_trained": len(train_samples)
    }
    with open(os.path.join(output_dir, "training_meta.json"), "w") as f:
        json.dump(meta, f, indent=2)

    logger.info("Custom model and metadata saved successfully!")
    return output_dir


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="OnePath AI Custom Model Training")
    parser.add_argument("--base_model", type=str, default="Qwen/Qwen2.5-0.5B-Instruct", help="Base HF model")
    parser.add_argument("--epochs", type=int, default=3, help="Training epochs")
    parser.add_argument("--batch_size", type=int, default=2, help="Batch size per step")
    parser.add_argument("--lr", type=float, default=2e-4, help="Learning rate")
    parser.add_argument("--output_dir", type=str, default=DEFAULT_OUTPUT_DIR, help="Destination directory")
    args = parser.parse_args()

    train(
        base_model_name=args.base_model,
        epochs=args.epochs,
        batch_size=args.batch_size,
        learning_rate=args.lr,
        output_dir=args.output_dir
    )
