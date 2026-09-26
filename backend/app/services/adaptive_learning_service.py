import os
import json
import random
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
import httpx
from sqlalchemy.orm import Session
from app.models.learning_engine import (
    StudentLearningProfile,
    DiagnosticAssessment,
    ConceptMastery,
    Flashcard,
    FlashcardReview,
    PersonalizedNote,
    RevisionItem,
    Quiz,
    QuizQuestion,
    QuizAttempt
)
from app.models.academic import Subject, Chapter, Module

class AdaptiveLearningService:
    # ---------------- 1. Multi-Level Adaptive Explanations ----------------
    async def generate_explanation(
        self,
        topic: str,
        level: str, # BEGINNER, INTERMEDIATE, ADVANCED
        format_type: str, # SIMPLE, DETAILED, ANALOGY, CODE, STEP_BY_STEP, QUESTIONS, SUMMARY
        custom_question: Optional[str] = None
    ) -> Dict[str, Any]:
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            try:
                system_prompt = (
                    f"You are MindForge's expert adaptive educational AI. "
                    f"Target Student Level: {level}. "
                    f"Requested Content Format: {format_type}. "
                    f"Provide an engaging, mathematically/technically sound explanation strictly tailored to the level."
                )
                user_prompt = f"Topic: {topic}\n"
                if custom_question:
                    user_prompt += f"Specific Student Question: {custom_question}\n"

                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(
                        url,
                        json={
                            "contents": [{"parts": [{"text": f"{system_prompt}\n\n{user_prompt}"}]}],
                            "generationConfig": {"temperature": 0.4, "maxOutputTokens": 800}
                        }
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        if text:
                            return {
                                "topic_title": topic,
                                "level": level,
                                "format_type": format_type,
                                "content": text.strip(),
                                "key_points": [f"Core principle of {topic}", f"Tailored for {level} mastery", f"Format: {format_type.title()}"],
                                "code_snippet": None,
                                "practice_prompt": f"Try explaining {topic} in your own words or testing with a code sample."
                            }
            except Exception as e:
                print(f"[Adaptive] Gemini explanation failed: {e}")

        # Deterministic High-Quality Pedagogical Synthesis
        explanations = {
            "BEGINNER": {
                "SIMPLE": (
                    f"### Understanding {topic} Simply\n\n"
                    f"Think of **{topic}** like an everyday tool in a workshop. It allows you to organize information step by step without getting overwhelmed.\n\n"
                    f"- **Why it matters:** It saves you from repeating manual work.\n"
                    f"- **How to think about it:** Like following a simple cooking recipe where each instruction happens in order."
                ),
                "ANALOGY": (
                    f"### Real-World Analogy for {topic}\n\n"
                    f"Imagine an automated conveyor belt at an airport luggage counter. Instead of a person walking each bag to the airplane individually, the conveyor belt systematically processes every item one after another.\n\n"
                    f"That is exactly how **{topic}** works in practice: it provides a reliable, repeatable mechanism to handle tasks effortlessly."
                ),
                "CODE": (
                    f"### Beginner Code Example: {topic}\n\n"
                    f"```python\n"
                    f"# A simple demonstration of {topic}\n"
                    f"items = ['apple', 'banana', 'cherry']\n"
                    f"for index, item in enumerate(items, start=1):\n"
                    f"    print(f'Item {{index}}: {{item}}')\n"
                    f"```\n\n"
                    f"Here, each step is executed line-by-line so you can easily observe what happens at each stage."
                ),
                "STEP_BY_STEP": (
                    f"### Step-by-Step Breakdown of {topic}\n\n"
                    f"1. **Identify the goal:** What do you want to achieve with {topic}?\n"
                    f"2. **Set up the input:** Prepare your baseline data or parameters.\n"
                    f"3. **Execute the core operation:** Run the primary process one step at a time.\n"
                    f"4. **Inspect the output:** Verify that the result matches expectations."
                ),
                "QUESTIONS": (
                    f"### Practice Questions for {topic}\n\n"
                    f"1. What is the primary purpose of {topic}?\n"
                    f"2. Can you name one real-life scenario where {topic} applies?\n"
                    f"3. What would happen if an input to {topic} is empty?"
                ),
                "SUMMARY": (
                    f"### Quick Summary: {topic}\n\n"
                    f"**{topic}** is a fundamental building block. Master its baseline syntax and intuitive mental model before advancing to complex edge cases."
                )
            },
            "INTERMEDIATE": {
                "SIMPLE": (
                    f"### Intermediate Guide to {topic}\n\n"
                    f"At this stage, **{topic}** goes beyond syntax. It is about data flow, state management, and avoiding common anti-patterns.\n\n"
                    f"Key considerations include scoping, boundary conditions, and resource efficiency."
                ),
                "ANALOGY": (
                    f"### Systems Analogy for {topic}\n\n"
                    f"Consider a modern logistics distribution center. Packages aren't just moved; they are routed based on priority, dimensions, and delivery constraints.\n\n"
                    f"Similarly, intermediate mastery of **{topic}** involves handling conditional branch logic, error trapping, and state persistence."
                ),
                "CODE": (
                    f"### Practical Code & Edge Cases: {topic}\n\n"
                    f"```python\n"
                    f"def process_data(data_stream: list) -> dict:\n"
                    f"    \"\"\"Robust implementation of {topic} handling edge cases.\"\"\"\n"
                    f"    if not data_stream:\n"
                    f"        return {{'status': 'empty', 'processed': 0}}\n"
                    f"    \n"
                    f"    results = [x * 2 for x in data_stream if x is not None]\n"
                    f"    return {{'status': 'success', 'data': results, 'count': len(results)}}\n"
                    f"```"
                ),
                "STEP_BY_STEP": (
                    f"### Intermediate Execution Pipeline: {topic}\n\n"
                    f"1. **Input validation & sanitization:** Guard against null or unexpected types.\n"
                    f"2. **State initialization:** Allocate required buffers or structures.\n"
                    f"3. **Batch or stream processing:** Iterate with proper exception handling.\n"
                    f"4. **Cleanup & post-conditions:** Ensure deterministic teardown and resource release."
                ),
                "QUESTIONS": (
                    f"### Diagnostic Challenges: {topic}\n\n"
                    f"1. What is the time complexity of typical operations in {topic}?\n"
                    f"2. How do you gracefully handle invalid inputs or edge conditions?\n"
                    f"3. Compare {topic} with its primary alternative paradigm."
                ),
                "SUMMARY": (
                    f"### Executive Summary: {topic}\n\n"
                    f"Intermediate {topic} emphasizes code cleanliness, handling boundary conditions, and adhering to standard design patterns."
                )
            },
            "ADVANCED": {
                "SIMPLE": (
                    f"### Deep Dive: {topic}\n\n"
                    f"At the advanced level, **{topic}** is analyzed through the lens of algorithmic complexity \\(O(n)\\), cache locality, memory overhead, and concurrency implications.\n\n"
                    f"Architectural trade-offs dictate whether to optimize for throughput, latency, or memory footprint."
                ),
                "ANALOGY": (
                    f"### Architectural Architecture Analogy: {topic}\n\n"
                    f"Think of a high-frequency trading matching engine. Microsecond latency matters; branch mispredictions and CPU cache misses degrade throughput.\n\n"
                    f"Treating **{topic}** at an expert level means understanding compiler optimizations, vectorized execution (SIMD), and thread-safety."
                ),
                "CODE": (
                    f"### High-Performance Optimization: {topic}\n\n"
                    f"```python\n"
                    f"import numpy as np\n"
                    f"# Vectorized, memory-efficient implementation of {topic}\n"
                    f"def optimized_pipeline(matrix: np.ndarray) -> np.ndarray:\n"
                    f"    # Zero-copy memory operations utilizing contiguous layout\n"
                    f"    assert matrix.flags['C_CONTIGUOUS']\n"
                    f"    return np.einsum('ij,jk->ik', matrix, matrix.T)\n"
                    f"```"
                ),
                "STEP_BY_STEP": (
                    f"### Low-Level Execution Lifecycle: {topic}\n\n"
                    f"1. **Memory alignment & pre-allocation:** Prevent runtime re-allocations.\n"
                    f"2. **Vectorization & instruction pipelining:** Leverage hardware primitives.\n"
                    f"3. **Concurrency & lock-free synchronization:** Eliminate critical-section contention.\n"
                    f"4. **Profiling & Benchmarking:** Measure with hardware performance counters."
                ),
                "QUESTIONS": (
                    f"### Advanced Architectural Questions: {topic}\n\n"
                    f"1. How does the memory layout impact cache misses in {topic}?\n"
                    f"2. How would you design a distributed, fault-tolerant version of this mechanism?\n"
                    f"3. Under what constraints would this approach fail to scale?"
                ),
                "SUMMARY": (
                    f"### High-Performance Summary: {topic}\n\n"
                    f"Advanced {topic} mastery requires profiling, algorithmic efficiency, thread safety, and minimal memory allocations."
                )
            }
        }

        level_key = level.upper() if level.upper() in explanations else "INTERMEDIATE"
        format_key = format_type.upper() if format_type.upper() in explanations[level_key] else "SIMPLE"
        content_text = explanations[level_key][format_key]

        return {
            "topic_title": topic,
            "level": level_key,
            "format_type": format_key,
            "content": content_text,
            "key_points": [
                f"Curated for {level_key.title()} depth",
                f"Style: {format_key.replace('_', ' ').title()}",
                "Curriculum grounded"
            ],
            "code_snippet": None,
            "practice_prompt": f"Reflect on how {topic} connects with your current curriculum goals."
        }

    # ---------------- 2. Personalized 7-Section Notes ----------------
    def generate_personalized_notes(
        self,
        student_id: str,
        subject_id: str,
        module_id: Optional[str],
        topic_title: str,
        db: Session
    ) -> PersonalizedNote:
        # Check if already generated
        existing = db.query(PersonalizedNote).filter(
            PersonalizedNote.student_id == student_id,
            PersonalizedNote.subject_id == subject_id,
            PersonalizedNote.topic_title == topic_title
        ).first()

        if existing:
            return existing

        overview = (
            f"{topic_title} is a cornerstone concept in this subject. "
            f"Mastering it provides the foundational intuition required for higher-order reasoning, "
            f"practical implementation, and real-world problem solving."
        )

        key_concepts = [
            f"Fundamental principles and structure of {topic_title}",
            "Core operational syntax and terminology",
            "Input-output lifecycle and boundary conditions",
            "Integration with prerequisite and adjacent concepts"
        ]

        simple_explanation = (
            f"At its heart, {topic_title} allows you to structure actions predictably. "
            f"Instead of handling isolated tasks manually, it provides a consistent, repeatable mechanism "
            f"that guarantees correctness across all standard inputs."
        )

        important_definitions = [
            {"term": f"{topic_title} Primitive", "definition": f"The atomic building block or operational unit of {topic_title}."},
            {"term": "State", "definition": "The active value or condition maintained throughout execution."},
            {"term": "Scope", "definition": "The operational boundary within which definitions and variables remain accessible."}
        ]

        examples = [
            {
                "title": f"Basic Usage Example",
                "description": f"Standard declaration and execution flow for {topic_title}.",
                "code_or_math": f"result = execute_{topic_title.lower().replace(' ', '_')}(inputs=['sample_data'])"
            },
            {
                "title": f"Edge Case Handling",
                "description": f"Ensuring clean fallbacks when input is empty or boundary limits are reached.",
                "code_or_math": f"if not data:\n    return default_fallback"
            }
        ]

        common_mistakes = [
            {
                "mistake": f"Ignoring edge conditions (e.g. empty or null inputs in {topic_title})",
                "correction": "Always implement defensive guard clauses at the beginning of the logic.",
                "why": "Unchecked edge conditions cause runtime faults and unexpected halts."
            },
            {
                "mistake": "Confusing shallow references with independent data copies",
                "correction": "Use explicit copies when mutation is required.",
                "why": "Accidental shared mutation leads to subtle bugs that are difficult to track."
            }
        ]

        quick_revision = (
            f"✓ {topic_title} automates structured workflows.\n"
            f"✓ Verify boundary conditions before processing.\n"
            f"✓ Avoid shared mutation without explicit isolation.\n"
            f"✓ Practice diagnostic questions to reinforce retention."
        )

        record = PersonalizedNote(
            student_id=student_id,
            subject_id=subject_id,
            module_id=module_id,
            topic_title=topic_title,
            overview=overview,
            key_concepts=key_concepts,
            simple_explanation=simple_explanation,
            important_definitions=important_definitions,
            examples=examples,
            common_mistakes=common_mistakes,
            quick_revision=quick_revision
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    # ---------------- 3. AI Flashcards Generation ----------------
    def generate_flashcards(
        self,
        subject_id: str,
        module_id: Optional[str],
        topic_title: str,
        count: int,
        db: Session
    ) -> List[Flashcard]:
        existing = db.query(Flashcard).filter(
            Flashcard.subject_id == subject_id,
            Flashcard.concept_tag == topic_title
        ).all()

        if len(existing) >= count:
            return existing[:count]

        # Seed realistic flashcard questions for the topic
        templates = [
            {
                "q": f"What is the primary role of {topic_title} in this curriculum?",
                "a": f"{topic_title} provides a structured mechanism to solve repetitive tasks and organize information deterministically.",
                "diff": "EASY"
            },
            {
                "q": f"What common mistake occurs when implementing {topic_title} without boundary validation?",
                "a": "Null pointer or index-out-of-bounds exceptions occur because empty inputs bypass execution logic.",
                "diff": "MEDIUM"
            },
            {
                "q": f"How does {topic_title} optimize computational complexity compared to naive brute-force?",
                "a": "It reduces redundant operations by indexing state or avoiding unneeded re-calculations.",
                "diff": "HARD"
            },
            {
                "q": f"Can you state the core invariant that must remain true throughout {topic_title}?",
                "a": "The data integrity and output type constraints must remain consistent from initialization to termination.",
                "diff": "MEDIUM"
            },
            {
                "q": f"When should you NOT use {topic_title}?",
                "a": "When the dataset is strictly static and trivial, where additional structural overhead outweighs benefits.",
                "diff": "HARD"
            }
        ]

        created = []
        for tmpl in templates[:count]:
            fc = Flashcard(
                subject_id=subject_id,
                module_id=module_id,
                front_question=tmpl["q"],
                back_answer=tmpl["a"],
                concept_tag=topic_title,
                difficulty=tmpl["diff"],
                created_by="AI"
            )
            db.add(fc)
            created.append(fc)

        db.commit()
        for fc in created:
            db.refresh(fc)
        return created

    # ---------------- 4. SM-2 Spaced Repetition Algorithm ----------------
    def review_flashcard(
        self,
        student_id: str,
        flashcard_id: str,
        rating: str, # AGAIN, HARD, GOOD, EASY
        db: Session
    ) -> FlashcardReview:
        review = db.query(FlashcardReview).filter(
            FlashcardReview.student_id == student_id,
            FlashcardReview.flashcard_id == flashcard_id
        ).first()

        now = datetime.now(timezone.utc)

        if not review:
            review = FlashcardReview(
                student_id=student_id,
                flashcard_id=flashcard_id,
                rating=rating,
                repetitions=0,
                interval_days=1,
                ease_factor=2.5,
                next_review_due=now,
                last_reviewed_at=now
            )
            db.add(review)

        # Standard SM-2 mapping
        # AGAIN -> Grade 1, HARD -> Grade 3, GOOD -> Grade 4, EASY -> Grade 5
        grade_map = {"AGAIN": 1, "HARD": 3, "GOOD": 4, "EASY": 5}
        grade = grade_map.get(rating.upper(), 4)

        if grade < 3: # AGAIN
            review.repetitions = 0
            review.interval_days = 1
        else: # Successful recall
            if review.repetitions == 0:
                review.interval_days = 1
            elif review.repetitions == 1:
                review.interval_days = 6
            else:
                review.interval_days = int(review.interval_days * review.ease_factor)
            review.repetitions += 1

        # Update Ease Factor: EF' = EF + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
        new_ef = review.ease_factor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
        review.ease_factor = max(1.3, round(new_ef, 2))

        # Bonus for EASY
        if rating.upper() == "EASY":
            review.interval_days = int(review.interval_days * 1.3)

        review.rating = rating.upper()
        review.last_reviewed_at = now
        review.next_review_due = now + timedelta(days=review.interval_days)

        # If card failed (AGAIN), add to Revision Queue
        fc = db.query(Flashcard).filter(Flashcard.id == flashcard_id).first()
        if fc and grade < 3:
            self._schedule_revision(
                student_id=student_id,
                subject_id=fc.subject_id,
                module_id=fc.module_id,
                topic_name=fc.concept_tag,
                priority="HIGH",
                reason=f"Failed flashcard recall on '{fc.concept_tag}'",
                db=db
            )

        db.commit()
        db.refresh(review)
        return review

    def _schedule_revision(
        self,
        student_id: str,
        subject_id: str,
        module_id: Optional[str],
        topic_name: str,
        priority: str,
        reason: str,
        db: Session
    ):
        existing = db.query(RevisionItem).filter(
            RevisionItem.student_id == student_id,
            RevisionItem.subject_id == subject_id,
            RevisionItem.topic_name == topic_name,
            RevisionItem.is_completed == False
        ).first()

        now = datetime.now(timezone.utc)
        if not existing:
            rev = RevisionItem(
                student_id=student_id,
                subject_id=subject_id,
                module_id=module_id,
                topic_name=topic_name,
                priority=priority,
                reason=reason,
                is_completed=False,
                due_date=now + timedelta(days=1 if priority == "HIGH" else 2)
            )
            db.add(rev)
        else:
            if priority == "HIGH":
                existing.priority = "HIGH"
                existing.reason = reason
                existing.due_date = now + timedelta(days=1)

    # ---------------- 5. Dynamic Quiz Engine ----------------
    def generate_dynamic_quiz(
        self,
        student_id: str,
        subject_id: str,
        module_id: Optional[str],
        topic_title: Optional[str],
        difficulty: str,
        question_count: int,
        db: Session
    ) -> Quiz:
        # Check student weak areas to tailor questions if adaptive
        target_concept = topic_title or "Core Concepts"
        if difficulty.upper() == "ADAPTIVE":
            weak_mastery = db.query(ConceptMastery).filter(
                ConceptMastery.student_id == student_id,
                ConceptMastery.subject_id == subject_id,
                ConceptMastery.status == "WEAK"
            ).first()
            if weak_mastery:
                target_concept = weak_mastery.concept_name

        quiz = Quiz(
            title=f"Personalized Quiz: {target_concept}",
            subject_id=subject_id,
            module_id=module_id,
            difficulty=difficulty.upper(),
            is_ai_generated=True,
            is_published=True
        )
        db.add(quiz)
        db.flush()

        # Seed structured questions
        question_bank = [
            {
                "q": f"Which of the following best defines the role of {target_concept}?",
                "opts": [
                    f"A deterministic method to manage data flow and operations",
                    "An external database plugin that requires separate installation",
                    "A styling rule applied exclusively to web browser styling",
                    "A deprecated syntax that has no runtime effect"
                ],
                "ans": 0,
                "diff": "EASY",
                "exp": f"{target_concept} is an essential structural element providing predictable data manipulation."
            },
            {
                "q": f"What occurs when an unhandled edge case is supplied to {target_concept}?",
                "opts": [
                    "The system silently ignores the error and produces random values",
                    "A runtime exception or boundary violation is triggered",
                    "The hardware memory is completely reset",
                    "The operating system crashes immediately"
                ],
                "ans": 1,
                "diff": "MEDIUM",
                "exp": "Defensive programming requires validating input parameters before passing them to internal routines."
            },
            {
                "q": f"How can you optimize the performance of operations involving {target_concept}?",
                "opts": [
                    "By running them in an infinite recursion loop",
                    "By avoiding redundant iterations and caching repeated lookups",
                    "By increasing the number of nested print statements",
                    "By duplicating memory variables across every scope"
                ],
                "ans": 1,
                "diff": "HARD",
                "exp": "Memoization, avoiding redundant loops, and utilizing efficient data structures optimize runtime performance."
            },
            {
                "q": f"Which principle is recommended for maintaining clean code with {target_concept}?",
                "opts": [
                    "Single Responsibility Principle and clear modularization",
                    "Writing all logic into a single 5000-line global script",
                    "Avoiding all variable naming conventions",
                    "Hardcoding all credentials and magic numbers directly"
                ],
                "ans": 0,
                "diff": "MEDIUM",
                "exp": "Single responsibility ensures each component has one reason to change and remains easily testable."
            },
            {
                "q": f"What is the expected output when {target_concept} receives an empty collection?",
                "opts": [
                    "SyntaxError: Missing semicolon",
                    "A safely handled empty result or default fallback state",
                    "Infinite loop that locks the processor",
                    "Corrupted system files"
                ],
                "ans": 1,
                "diff": "EASY",
                "exp": "Robust implementations gracefully handle empty collections with an early return or default container."
            }
        ]

        for i, item in enumerate(question_bank[:question_count]):
            q_rec = QuizQuestion(
                quiz_id=quiz.id,
                question=item["q"],
                options=item["opts"],
                correct_option_index=item["ans"],
                explanation=item["exp"],
                concept_tag=target_concept,
                difficulty=item["diff"]
            )
            db.add(q_rec)

        db.commit()
        db.refresh(quiz)
        return quiz

    def grade_quiz_attempt(
        self,
        student_id: str,
        quiz_id: str,
        user_answers: Dict[str, int],
        db: Session
    ) -> Dict[str, Any]:
        quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
        if not quiz:
            raise ValueError("Quiz not found")

        questions = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == quiz_id).all()
        if not questions:
            raise ValueError("Quiz has no questions")

        score = 0
        total = len(questions)
        graded_details = []
        concept_stats: Dict[str, Dict[str, int]] = {}

        for q in questions:
            selected = user_answers.get(q.id, -1)
            is_correct = (selected == q.correct_option_index)
            if is_correct:
                score += 1

            tag = q.concept_tag or "General"
            if tag not in concept_stats:
                concept_stats[tag] = {"correct": 0, "total": 0}
            concept_stats[tag]["total"] += 1
            if is_correct:
                concept_stats[tag]["correct"] += 1

            graded_details.append({
                "question_id": q.id,
                "question": q.question,
                "options": q.options,
                "user_answer": selected,
                "correct_answer": q.correct_option_index,
                "is_correct": is_correct,
                "explanation": q.explanation,
                "concept_tag": tag
            })

        percentage = round((score / total) * 100.0, 1)

        # Concept breakdown
        concept_breakdown: Dict[str, str] = {}
        for tag, stats in concept_stats.items():
            rate = stats["correct"] / stats["total"]
            status = "STRONG" if rate >= 0.75 else ("MEDIUM" if rate >= 0.5 else "WEAK")
            concept_breakdown[tag] = status

            # Update ConceptMastery record
            mastery = db.query(ConceptMastery).filter(
                ConceptMastery.student_id == student_id,
                ConceptMastery.subject_id == quiz.subject_id,
                ConceptMastery.concept_name == tag
            ).first()

            now = datetime.now(timezone.utc)
            if not mastery:
                mastery = ConceptMastery(
                    student_id=student_id,
                    subject_id=quiz.subject_id,
                    concept_name=tag,
                    status=status,
                    score=int(rate * 100),
                    mistakes_count=stats["total"] - stats["correct"],
                    last_evaluated_at=now
                )
                db.add(mastery)
            else:
                mastery.score = int((mastery.score + int(rate * 100)) / 2)
                mastery.mistakes_count += (stats["total"] - stats["correct"])
                mastery.status = "STRONG" if mastery.score >= 75 else ("MEDIUM" if mastery.score >= 50 else "WEAK")
                mastery.last_evaluated_at = now

            # If weak, auto-schedule Revision Item
            if status == "WEAK":
                self._schedule_revision(
                    student_id=student_id,
                    subject_id=quiz.subject_id,
                    module_id=quiz.module_id,
                    topic_name=tag,
                    priority="HIGH",
                    reason=f"Scored {int(rate*100)}% on '{tag}' in {quiz.title}",
                    db=db
                )

        # Save Attempt
        attempt = QuizAttempt(
            student_id=student_id,
            quiz_id=quiz_id,
            score=score,
            max_score=total,
            percentage=percentage,
            user_answers=user_answers,
            concept_breakdown=concept_breakdown,
            completed_at=datetime.now(timezone.utc)
        )
        db.add(attempt)

        # Update StudentLearningProfile stats
        profile = db.query(StudentLearningProfile).filter(
            StudentLearningProfile.student_id == student_id
        ).first()

        if profile:
            # Recompute overall quiz accuracy across all attempts
            all_attempts = db.query(QuizAttempt).filter(QuizAttempt.student_id == student_id).all()
            total_scored = sum(a.score for a in all_attempts) + score
            total_possible = sum(a.max_score for a in all_attempts) + total
            if total_possible > 0:
                profile.quiz_accuracy = round((total_scored / total_possible) * 100.0, 1)

            # Update streak
            now = datetime.now(timezone.utc)
            if profile.last_active_date:
                days_diff = (now.date() - profile.last_active_date.date()).days
                if days_diff == 1:
                    profile.streak_days += 1
                elif days_diff > 1:
                    profile.streak_days = 1
            profile.last_active_date = now

        db.commit()
        db.refresh(attempt)

        rec_text = "Excellent job! You are ready for the next topic."
        weak_list = [k for k, v in concept_breakdown.items() if v == "WEAK"]
        if weak_list:
            rec_text = f"Review needed for {', '.join(weak_list)}. Check your Revision Queue on the dashboard!"

        return {
            "attempt": attempt,
            "graded_questions": graded_details,
            "recommendation": rec_text
        }

    # ---------------- 6. Chapter Adaptive Lesson Generation ----------------
    async def generate_chapter_adaptive_lesson(
        self,
        student_id: str,
        chapter_id: str,
        db: Session
    ) -> Dict[str, Any]:
        from app.services.rag_service import rag_service
        from app.services.knowledge_graph_service import knowledge_graph_service

        chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
        if not chapter:
            raise ValueError(f"Chapter {chapter_id} not found")

        subject = db.query(Subject).filter(Subject.id == chapter.subject_id).first()
        subject_name = subject.name if subject else "Subject"

        # Fetch DiagnosticAssessment for this chapter
        diag = db.query(DiagnosticAssessment).filter(
            DiagnosticAssessment.student_id == student_id,
            DiagnosticAssessment.chapter_id == chapter_id
        ).order_by(DiagnosticAssessment.completed_at.desc()).first()

        # Fallback profile if student hasn't taken diagnostic yet
        if diag and diag.learner_profile:
            profile = diag.learner_profile
            student_explanation = diag.student_explanation or "Adaptive lesson tailored to your diagnostic results."
        else:
            profile = {
                "knowledge_level": "foundational",
                "difficulty_level": "moderate",
                "interest_level": "medium",
                "visual_support_need": "high",
                "real_world_interest": "high",
                "content_density": "low",
                "explanation_complexity": "simple",
                "example_frequency": "high",
                "memory_support": "high",
                "contradiction_flag": False,
                "confidence_score": 0.5
            }
            student_explanation = "Before starting, take the quick 1-minute diagnostic above to personalize this lesson further!"

        # Query RAG Grounded Content
        rag_res = await rag_service.query_knowledge_base(
            subject_id=chapter.subject_id,
            question=f"Explain {chapter.title} core concepts, definitions, real world applications, and examples",
            module_id=None,
            db=db
        )
        rag_context = rag_res.get("answer", "") if rag_res.get("source_found") else ""

        # Query Knowledge Graph Prerequisites
        graph_data = knowledge_graph_service.get_or_seed_knowledge_graph(chapter.subject_id, db)
        prereqs_recap = [n.name for n in graph_data.get("nodes", [])[:2]]

        # Construct Structured Sections based on Learner Profile
        knowledge_lvl = profile.get("knowledge_level", "foundational")
        is_visual = profile.get("visual_support_need", "high") == "high"
        is_rw = profile.get("real_world_interest", "high") == "high"
        is_low_interest = profile.get("interest_level", "medium") == "low"

        sections = []

        # 1. Concept Introduction
        if knowledge_lvl == "foundational":
            intro_title = f"1. Baseline Principles of {chapter.title}"
            intro_content = (
                f"Before moving into advanced details, let's establish what **{chapter.title}** represents in simple words.\n\n"
                f"{chapter.description or 'This topic covers essential foundations that build directly on everyday observations.'}\n\n"
                f"**Key Focus:** Understanding the foundational definitions and core relationships."
            )
            intro_bullets = [
                f"What is {chapter.title}?",
                "Core definitions & baseline terms",
                "Why this principle matters"
            ]
        elif knowledge_lvl == "advanced":
            intro_title = f"1. Advanced Overview: {chapter.title}"
            intro_content = (
                f"You have demonstrated a strong baseline in this area. We will focus on higher-order application, structural mechanics, and edge conditions of **{chapter.title}**.\n\n"
                f"{chapter.description or 'Explores advanced interactions and mathematical/analytical frameworks.'}"
            )
            intro_bullets = [
                f"Analytical framework of {chapter.title}",
                "State transitions and system constraints",
                "Higher-order problem solving"
            ]
        else:
            intro_title = f"1. Understanding {chapter.title}"
            intro_content = (
                f"**{chapter.title}** is a central concept in {subject_name}. It explains how components interact under specific conditions.\n\n"
                f"{chapter.description or 'Covers practical properties and foundational rules.'}"
            )
            intro_bullets = [
                f"Main principles of {chapter.title}",
                "Operational rules and behavior",
                "Practical applications"
            ]

        sections.append({
            "title": intro_title,
            "section_type": "concept",
            "content": intro_content,
            "bullet_points": intro_bullets,
            "visual_component": None,
            "quick_check_question": None
        })

        # 2. In Simple Words
        sections.append({
            "title": "2. In Simple Words",
            "section_type": "in_simple_words",
            "content": (
                f"Imagine **{chapter.title}** like an everyday mechanism. Rather than memorizing long formulas, think of it as a set of rules:\n\n"
                f"- **Condition:** When an input or change occurs\n"
                f"- **Action:** The system responds according to standard principles\n"
                f"- **Result:** A predictable, measurable outcome"
            ),
            "bullet_points": [
                "Simple mental model",
                "Cause-and-effect relationship",
                "Predictable outcomes"
            ],
            "visual_component": None,
            "quick_check_question": None
        })

        # 3. Structured Visual Component (Comparison Table & Flow Diagram)
        if is_visual or profile.get("difficulty_level") == "high":
            flow_steps = [
                {"step_number": "1", "title": "Baseline Input", "description": f"Initial state before {chapter.title} process begins."},
                {"step_number": "2", "title": "Core Reaction / Process", "description": f"The main interaction or state shift in {chapter.title}."},
                {"step_number": "3", "title": "Measurable Result", "description": "Final output, equilibrium, or observed product."}
            ]
            comp_headers = ["Property", f"Standard {chapter.title}", "Opposite / Boundary State"]
            comp_rows = [
                ["Primary Characteristic", "Active & Responsive", "Passive / Inert"],
                ["Observed Indicator", "Measurable state change", "No reaction"],
                ["Typical Example", f"Core process of {chapter.title}", "Control baseline"]
            ]
            sections.append({
                "title": "3. Visual Breakdown & Process Flow",
                "section_type": "flow_diagram",
                "content": f"Use this step-by-step visual process flow to understand how **{chapter.title}** operates from start to finish:",
                "bullet_points": ["Step 1: Baseline Input", "Step 2: Core Reaction", "Step 3: Measurable Result"],
                "visual_component": {
                    "type": "flow_diagram",
                    "title": f"Process Lifecycle of {chapter.title}",
                    "steps": flow_steps,
                    "headers": comp_headers,
                    "rows": comp_rows
                },
                "quick_check_question": None
            })

        # 4. Real-World Applications (Grounded in RAG context if available)
        rw_body = rag_context if rag_context else (
            f"Here is how **{chapter.title}** shows up in daily life:\n\n"
            f"- **Household items:** Common acids & bases like vinegar, lemons, soap, and toothpaste.\n"
            f"- **Biological systems:** Stomach digestive acids and soil pH balance for plants.\n"
            f"- **Industrial uses:** Water purification and chemical manufacturing."
        )
        sections.append({
            "title": "4. Real-World Applications",
            "section_type": "real_world_application",
            "content": rw_body,
            "bullet_points": ["Vinegar & Lemons (Acidic)", "Soap & Toothpaste (Basic)", "Stomach Acid & Digestion"],
            "visual_component": None,
            "quick_check_question": None
        })

        # 5. Remember Memory Trick
        sections.append({
            "title": "5. Key Memory Tip",
            "section_type": "remember_tip",
            "content": (
                f"> **Remember:**\n"
                f"> Lower pH values (< 7) → More Acidic\n"
                f"> Higher pH values (> 7) → More Basic / Alkaline\n"
                f"> Neutral (pH = 7) → Pure Water"
            ),
            "bullet_points": ["pH < 7 = Acidic", "pH = 7 = Neutral", "pH > 7 = Basic"],
            "visual_component": None,
            "quick_check_question": None
        })

        # 6. Quick Check Question
        sections.append({
            "title": "6. Quick Check",
            "section_type": "quick_check",
            "content": f"Test your intuition on **{chapter.title}** with this quick question:",
            "bullet_points": [],
            "visual_component": None,
            "quick_check_question": {
                "question": f"Which of the following is a primary characteristic of {chapter.title}?",
                "options": [
                    f"It causes predictable state changes under specific environmental rules",
                    "It has no measurable properties under any conditions",
                    "It only exists in outer space",
                    "It requires computer code to function"
                ],
                "correct_option_index": 0,
                "explanation": f"State changes according to consistent rules form the fundamental definition of {chapter.title}."
            }
        })

        lesson_out = {
            "chapter_id": chapter.id,
            "chapter_title": chapter.title,
            "subject_id": chapter.subject_id,
            "subject_name": subject_name,
            "student_explanation": student_explanation,
            "learner_profile": {
                "student_id": student_id,
                "chapter_id": chapter_id,
                "knowledge_level": profile.get("knowledge_level", "foundational"),
                "difficulty_level": profile.get("difficulty_level", "moderate"),
                "interest_level": profile.get("interest_level", "medium"),
                "visual_support_need": profile.get("visual_support_need", "high"),
                "real_world_interest": profile.get("real_world_interest", "high"),
                "content_density": profile.get("content_density", "low"),
                "explanation_complexity": profile.get("explanation_complexity", "simple"),
                "example_frequency": profile.get("example_frequency", "high"),
                "memory_support": profile.get("memory_support", "high"),
                "contradiction_flag": profile.get("contradiction_flag", False),
                "confidence_score": profile.get("confidence_score", 0.5),
                "student_explanation": student_explanation,
                "completed_at": diag.completed_at if diag else datetime.now(timezone.utc)
            },
            "prerequisites_recap": prereqs_recap,
            "sections": sections
        }

        return lesson_out

adaptive_learning_service = AdaptiveLearningService()
