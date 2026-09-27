"""
OnePath AI (MindForge) - Educational Dataset Generator
Extracts curriculum data, modules, diagnostics, quizzes, and Q&A from the database
and creates formatted instruction-tuning datasets for training our custom model.
"""

import os
import json
import sqlite3
from typing import List, Dict, Any

DATABASE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "onepath_ai.db")
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")

SYSTEM_PROMPT = (
    "You are OnePath AI's dedicated educational tutor. Your role is to guide students, "
    "provide clear, accurate, and pedagogical explanations for questions in their curriculum, "
    "help them overcome misconceptions, and ground your answers in sound scientific and mathematical principles."
)

# Foundational domain curriculum Q&A templates to augment database knowledge
FOUNDATIONAL_CURRICULUM_DATA = [
    {
        "instruction": "Explain the concept of Matter in simple terms and list its three primary states.",
        "input": "",
        "output": "Matter is anything that has mass and occupies space (volume). Everything around us—such as water, air, books, and rocks—is made of matter.\n\nThe three primary states of matter are:\n1. **Solid**: Definite shape and fixed volume. Particles are tightly packed and vibrate in fixed positions (e.g., ice, wood).\n2. **Liquid**: Fixed volume but no fixed shape (takes the shape of its container). Particles are close together but free to slide past one another (e.g., water, oil).\n3. **Gas**: Neither definite shape nor fixed volume (expands to fill the container). Particles are far apart and move rapidly in all directions (e.g., oxygen, steam)."
    },
    {
        "instruction": "What is Dalton's Atomic Theory? State its major postulates.",
        "input": "",
        "output": "John Dalton formulated Dalton's Atomic Theory in 1808 to explain the laws of chemical combination. Its major postulates are:\n1. All matter is composed of tiny, indivisible particles called **atoms**.\n2. Atoms of a given element are identical in mass and chemical properties.\n3. Atoms of different elements differ in mass and chemical properties.\n4. Atoms can neither be created nor destroyed in a chemical reaction (Conservation of Mass).\n5. Compounds are formed when atoms of different elements combine in fixed whole-number ratios (Law of Definite Proportions).\n6. In a given compound, the relative number and types of atoms are constant."
    },
    {
        "instruction": "State Newton's Three Laws of Motion with short examples for each.",
        "input": "",
        "output": "Newton's Three Laws of Motion form the foundation of classical mechanics:\n\n1. **First Law (Law of Inertia)**: An object remains at rest or in uniform motion in a straight line unless acted upon by an external unbalanced force.\n   *Example*: Passengers jerk backward when a bus abruptly accelerates forward.\n\n2. **Second Law (F = ma)**: The rate of change of momentum of an object is directly proportional to the applied unbalanced force in the direction of the force.\n   *Example*: A cricket fielder pulls their hands backward while catching a ball to increase time, decreasing the impact force.\n\n3. **Third Law (Action and Reaction)**: For every action, there is an equal and opposite reaction.\n   *Example*: When a rocket expels exhaust gases downward (action), the reacting thrust pushes the rocket upward (reaction)."
    },
    {
        "instruction": "What is the difference between distance and displacement?",
        "input": "",
        "output": "The differences between distance and displacement are:\n\n1. **Nature**: Distance is a **scalar** quantity (has magnitude only). Displacement is a **vector** quantity (has both magnitude and direction).\n2. **Definition**: Distance is the total path length traveled by an object. Displacement is the shortest straight-line distance from the initial to the final position.\n3. **Value**: Distance is always positive and cannot be zero for a moving object. Displacement can be positive, negative, or zero (e.g., completing a circular lap returns displacement to 0).\n4. **Magnitude Comparison**: Distance is always greater than or equal to the magnitude of displacement (Distance ≥ |Displacement|)."
    },
    {
        "instruction": "Explain the structure of an atom and describe protons, neutrons, and electrons.",
        "input": "",
        "output": "An atom consists of a central dense nucleus surrounded by electron orbits (shells):\n\n1. **Protons**: Positively charged subatomic particles located inside the nucleus. Charge: +1 (+1.6 × 10⁻¹⁹ C), relative mass: ~1 amu.\n2. **Neutrons**: Electrically neutral particles located inside the nucleus alongside protons (discovered by James Chadwick). Relative mass: ~1 amu.\n3. **Electrons**: Negatively charged subatomic particles orbiting the nucleus in energy levels/shells (discovered by J.J. Thomson). Charge: -1, relative mass: ~1/1836 amu (negligible compared to nucleons).\n\nIn a neutral atom, Number of Protons = Number of Electrons = Atomic Number (Z)."
    },
    {
        "instruction": "What is Ohm's Law? Give its mathematical formula and unit of resistance.",
        "input": "",
        "output": "Ohm's Law states that at constant temperature, the electric current (I) flowing through a metallic conductor is directly proportional to the potential difference (V) applied across its ends.\n\n**Formula**:\n$$V = I \\times R$$\nWhere:\n- $V$ = Potential Difference (Volts, V)\n- $I$ = Electric Current (Amperes, A)\n- $R$ = Resistance (Ohms, $\\Omega$)\n\nThe SI unit of electrical resistance is the **Ohm ($\\Omega$)**. One ohm is defined as the resistance of a conductor through which a current of 1 Ampere flows when a potential difference of 1 Volt is applied."
    },
    {
        "instruction": "Explain the difference between rational and irrational numbers.",
        "input": "",
        "output": "In mathematics:\n\n- **Rational Numbers**: Any number that can be expressed in the form $\\frac{p}{q}$, where $p$ and $q$ are integers and $q \\neq 0$. Their decimal expansions are either **terminating** (e.g., $0.75 = 3/4$) or **non-terminating repeating** (e.g., $0.333... = 1/3$). Examples: $5, -2, 3/7, 0.5$.\n\n- **Irrational Numbers**: Any real number that cannot be expressed as $\\frac{p}{q}$. Their decimal expansions are **non-terminating and non-repeating**. Examples: $\\sqrt{2}, \\sqrt{3}, \\pi, e$.\n\nTogether, rational and irrational numbers make up the set of **Real Numbers**."
    },
    {
        "instruction": "Explain the Law of Conservation of Energy and give an example.",
        "input": "",
        "output": "The Law of Conservation of Energy states that energy can neither be created nor destroyed; it can only be transformed from one form to another. The total energy of an isolated system remains constant.\n\n**Example (Simple Pendulum)**:\n- At the extreme positions, the pendulum bob has maximum Potential Energy (PE) and zero Kinetic Energy (KE).\n- As it swings through the mean position, height is minimum (minimum PE) and speed is maximum (maximum KE).\n- At any intermediate point, Total Energy = PE + KE = constant."
    }
]


def extract_data_from_db(db_path: str) -> List[Dict[str, Any]]:
    """Query onepath_ai.db to pull real curriculum subjects, chapters, modules, and Q&A."""
    samples = []
    if not os.path.exists(db_path):
        print(f"[Warning] Database file not found at: {db_path}")
        return samples

    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # 1. Pull Modules and Chapters with Subject information
        cursor.execute("""
            SELECT 
                s.name as subject_name,
                c.title as chapter_title,
                m.title as module_title,
                m.description as module_desc
            FROM modules m
            JOIN chapters c ON m.chapter_id = c.id
            JOIN subjects s ON c.subject_id = s.id
        """)
        rows = cursor.fetchall()
        for r in rows:
            sub = r["subject_name"]
            chap = r["chapter_title"]
            mod = r["module_title"]
            desc = r["module_desc"] or ""

            # Sample 1: Conceptual explanation
            samples.append({
                "instruction": f"In {sub}, specifically Chapter '{chap}', explain the core concepts of '{mod}'.",
                "input": f"Module: {mod}. Context: {desc}",
                "output": f"In the study of **{sub}** under the chapter **{chap}**, the module **{mod}** covers crucial principles:\n\n{desc if desc else f'This module explores the foundational mechanisms and applications of {mod}.'}\n\nTo master this topic, students should focus on understanding the definitions, practicing the core equations, and identifying real-world applications."
            })

            # Sample 2: Study Workspace Mode breakdown (JSON)
            json_output = {
                "explanation": f"{mod} is a fundamental concept in {chap} ({sub}). {desc}",
                "key_points": [
                    f"Core topic: {mod}",
                    f"Belongs to: {chap}",
                    "Curriculum verified NCERT standard"
                ],
                "real_world_analogy": f"Understanding {mod} is like learning the rules of a game; it provides the building blocks for solving advanced problems in {sub}."
            }
            samples.append({
                "instruction": f"Provide a structured pedagogical study breakdown for the topic '{mod}'.",
                "input": f"Subject: {sub}\nChapter: {chap}\nSelected Text: {mod}",
                "output": json.dumps(json_output, indent=2)
            })

        # 2. Pull AskTeacher Questions if any exist
        cursor.execute("""
            SELECT 
                s.name as subject_name,
                c.title as chapter_title,
                q.question,
                q.answer,
                q.selected_text
            FROM ask_teacher_questions q
            LEFT JOIN subjects s ON q.subject_id = s.id
            LEFT JOIN chapters c ON q.chapter_id = c.id
            WHERE q.answer IS NOT NULL AND trim(q.answer) != ''
        """)
        q_rows = cursor.fetchall()
        for qr in q_rows:
            samples.append({
                "instruction": f"Student question regarding {qr['subject_name'] or 'Science'}: {qr['question']}",
                "input": f"Context/Selected snippet: {qr['selected_text']}" if qr["selected_text"] else "",
                "output": qr["answer"]
            })

        conn.close()
        print(f"[Dataset Generator] Successfully extracted {len(samples)} samples from database.")
    except Exception as e:
        print(f"[Dataset Generator] Error reading SQLite database: {e}")

    return samples


def generate_training_dataset(output_dir: str = OUTPUT_DIR) -> Dict[str, str]:
    """Generates train and validation JSONL files."""
    os.makedirs(output_dir, exist_ok=True)

    all_data = []
    # 1. Add foundational curriculum examples
    all_data.extend(FOUNDATIONAL_CURRICULUM_DATA)

    # 2. Add database extracted records
    db_data = extract_data_from_db(DATABASE_PATH)
    all_data.extend(db_data)

    # Format into standard instruction tuning format (ChatML / Alpaca)
    formatted_dataset = []
    for item in all_data:
        entry = {
            "system": SYSTEM_PROMPT,
            "instruction": item["instruction"],
            "input": item.get("input", ""),
            "output": item["output"]
        }
        formatted_dataset.append(entry)

    # Split 85% train, 15% validation
    split_idx = max(1, int(len(formatted_dataset) * 0.85))
    train_data = formatted_dataset[:split_idx]
    val_data = formatted_dataset[split_idx:] if split_idx < len(formatted_dataset) else formatted_dataset[:2]

    train_path = os.path.join(output_dir, "train.jsonl")
    val_path = os.path.join(output_dir, "val.jsonl")

    with open(train_path, "w", encoding="utf-8") as f:
        for ex in train_data:
            f.write(json.dumps(ex, ensure_ascii=False) + "\n")

    with open(val_path, "w", encoding="utf-8") as f:
        for ex in val_data:
            f.write(json.dumps(ex, ensure_ascii=False) + "\n")

    print(f"[Dataset Generator] Saved {len(train_data)} train samples to {train_path}")
    print(f"[Dataset Generator] Saved {len(val_data)} validation samples to {val_path}")

    return {"train": train_path, "val": val_path, "total_samples": len(formatted_dataset)}


if __name__ == "__main__":
    res = generate_training_dataset()
    print("Dataset generation complete:", res)
