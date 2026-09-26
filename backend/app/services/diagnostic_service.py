import os
import json
import httpx
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.learning_engine import (
    DiagnosticQuestion,
    DiagnosticAssessment,
    ConceptMastery,
    StudentLearningProfile,
    RevisionItem
)
from app.models.academic import Subject, Chapter

class DiagnosticService:
    def get_or_seed_diagnostic_questions(self, subject_id: str, db: Session) -> List[DiagnosticQuestion]:
        questions = db.query(DiagnosticQuestion).filter(
            DiagnosticQuestion.subject_id == subject_id,
            DiagnosticQuestion.chapter_id == None
        ).all()

        if not questions:
            # Seed 5 comprehensive diagnostic questions across standard concepts
            seeds = [
                {
                    "concept": "Basics & Variables",
                    "q": "Which of the following represents an immutable primitive data structure?",
                    "opts": ["Tuple", "List", "Dictionary", "Set"],
                    "ans": 0,
                    "diff": "EASY",
                    "exp": "Tuples cannot be modified in place after creation, guaranteeing immutability."
                },
                {
                    "concept": "Loops & Iteration",
                    "q": "What will happen if the loop termination condition in a while loop is never satisfied?",
                    "opts": [
                        "The program halts and returns None immediately",
                        "An infinite loop occurs consuming CPU resources",
                        "The compiler rewrites the loop into a for loop",
                        "A SyntaxError is thrown before execution"
                    ],
                    "ans": 1,
                    "diff": "EASY",
                    "exp": "Failing to increment or update the condition results in an unbounded infinite execution loop."
                },
                {
                    "concept": "Functions & Scope",
                    "q": "What happens when a variable declared inside a function is accessed from the outer global scope without declaration?",
                    "opts": [
                        "It inherits the value seamlessly",
                        "A NameError is raised because the variable is locally scoped",
                        "The variable defaults to 0",
                        "The variable is converted into a string"
                    ],
                    "ans": 1,
                    "diff": "MEDIUM",
                    "exp": "Local function variables exist solely in the function call frame stack and are inaccessible outside."
                },
                {
                    "concept": "Object-Oriented Programming",
                    "q": "What core OOP principle allows a derived subclass to provide a specific implementation of a method already defined in its parent class?",
                    "opts": ["Encapsulation", "Method Overriding (Polymorphism)", "Serialization", "Garbage Collection"],
                    "ans": 1,
                    "diff": "MEDIUM",
                    "exp": "Polymorphism through method overriding enables runtime dynamic method dispatch."
                },
                {
                    "concept": "Algorithmic Complexity & Optimization",
                    "q": "Which data structure provides average O(1) time complexity for lookup, insertion, and deletion operations?",
                    "opts": ["Linked List", "Hash Table (Dictionary)", "Binary Search Tree", "Sorted Array"],
                    "ans": 1,
                    "diff": "HARD",
                    "exp": "Hash tables compute array indices using hash functions, achieving average constant O(1) time complexity."
                }
            ]

            created = []
            for s in seeds:
                q = DiagnosticQuestion(
                    subject_id=subject_id,
                    concept=s["concept"],
                    question=s["q"],
                    options=s["opts"],
                    correct_option_index=s["ans"],
                    difficulty=s["diff"],
                    explanation=s["exp"],
                    question_type="PRIOR_KNOWLEDGE"
                )
                db.add(q)
                created.append(q)

            db.commit()
            for q in created:
                db.refresh(q)
            questions = created

        return questions

    def get_or_seed_chapter_diagnostic_questions(self, chapter_id: str, db: Session) -> List[DiagnosticQuestion]:
        questions = db.query(DiagnosticQuestion).filter(
            DiagnosticQuestion.chapter_id == chapter_id
        ).all()

        if questions:
            return questions

        chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
        if not chapter:
            raise ValueError(f"Chapter with ID {chapter_id} not found")

        subject_id = chapter.subject_id
        ch_title = chapter.title

        # Seed 7 chapter-specific diagnostic questions (3 prior knowledge + 4 perceptions/preferences)
        seeds = [
            # 1. Prior Knowledge Q1
            {
                "type": "PRIOR_KNOWLEDGE",
                "concept": f"{ch_title} Baseline",
                "q": f"Before studying {ch_title}, which of the following best describes its core underlying concept?",
                "opts": [
                    f"A foundational mechanism governing how elements in {ch_title} interact",
                    f"An obsolete historical model that has no application in modern science/math",
                    f"A pure styling convention used only for documentation formatting",
                    f"An advanced topic completely unrelated to previous prerequisites"
                ],
                "ans": 0,
                "diff": "EASY",
                "exp": f"{ch_title} provides core principles that connect directly with prerequisite topics."
            },
            # 2. Prior Knowledge Q2
            {
                "type": "PRIOR_KNOWLEDGE",
                "concept": f"{ch_title} Principles",
                "q": f"When examining the behavior of components in {ch_title}, what is the primary relationship observed?",
                "opts": [
                    "Components change predictably based on environmental and structural constraints",
                    "Components behave completely randomly without any physical or mathematical laws",
                    "All components collapse immediately into zero state",
                    "Components can only be measured using analog measuring tape"
                ],
                "ans": 0,
                "diff": "MEDIUM",
                "exp": f"Predictable relationships under constraints form the scientific baseline of {ch_title}."
            },
            # 3. Prior Knowledge Q3
            {
                "type": "PRIOR_KNOWLEDGE",
                "concept": f"{ch_title} Application",
                "q": f"Which of the following is a classic indicator or practical result when applying {ch_title}?",
                "opts": [
                    "A measurable change in state, scale, or output values",
                    "A permanent loss of all system memory",
                    "An automatic system shutdown",
                    "No change of any kind under any circumstances"
                ],
                "ans": 0,
                "diff": "HARD",
                "exp": f"State changes and measurable outputs are key indicators in {ch_title}."
            },
            # 4. Difficulty Perception
            {
                "type": "DIFFICULTY_PERCEPTION",
                "concept": "Topic Perception",
                "q": f"How difficult does '{ch_title}' feel to you right now?",
                "opts": ["Easy", "Manageable", "A little difficult", "Very difficult"],
                "ans": None,
                "diff": "EASY",
                "exp": "Helps MindForge gauge your self-perceived confidence level."
            },
            # 5. Interest Scale
            {
                "type": "INTEREST_LEVEL",
                "concept": "Topic Interest",
                "q": f"How interested are you in learning about '{ch_title}'?",
                "opts": ["1 - Low interest", "2 - Mild interest", "3 - Moderate interest", "4 - High interest", "5 - Very high interest"],
                "ans": None,
                "diff": "EASY",
                "exp": "Determines content density and explanation length."
            },
            # 6. Visual Support Preference
            {
                "type": "VISUAL_PREFERENCE",
                "concept": "Learning Style Preference",
                "q": "What would help you understand a new concept faster?",
                "opts": ["Diagrams & Flowcharts", "Real-life examples", "Short explanations", "Step-by-step worked examples"],
                "ans": None,
                "diff": "EASY",
                "exp": "Guides whether MindForge renders extra visual comparison charts and process diagrams."
            },
            # 7. Real-World Application Preference
            {
                "type": "REAL_WORLD_INTEREST",
                "concept": "Practical Context",
                "q": "Would you like to see how this topic is used in real life?",
                "opts": ["Yes, definitely", "Sometimes", "Not really"],
                "ans": None,
                "diff": "EASY",
                "exp": "Determines frequency of real-world applications and everyday analogies."
            }
        ]

        created = []
        for s in seeds:
            q = DiagnosticQuestion(
                subject_id=subject_id,
                chapter_id=chapter_id,
                question_type=s["type"],
                concept=s["concept"],
                question=s["q"],
                options=s["opts"],
                correct_option_index=s["ans"],
                difficulty=s["diff"],
                explanation=s["exp"]
            )
            db.add(q)
            created.append(q)

        db.commit()
        for q in created:
            db.refresh(q)
        return created

    def evaluate_diagnostic(
        self,
        student_id: str,
        subject_id: str,
        answers: Dict[str, int],
        db: Session
    ) -> DiagnosticAssessment:
        questions = self.get_or_seed_diagnostic_questions(subject_id, db)
        total_questions = len(questions)
        if total_questions == 0:
            raise ValueError(f"No diagnostic questions found for subject {subject_id}")

        score = 0
        topic_counts: Dict[str, Dict[str, int]] = {}

        for q in questions:
            concept = q.concept
            if concept not in topic_counts:
                topic_counts[concept] = {"correct": 0, "total": 0}
            topic_counts[concept]["total"] += 1

            selected = answers.get(q.id, -1)
            if q.correct_option_index is not None and selected == q.correct_option_index:
                score += 1
                topic_counts[concept]["correct"] += 1

        percentage = round((score / total_questions) * 100.0, 1)

        if percentage >= 80.0:
            assigned_level = "ADVANCED"
        elif percentage >= 50.0:
            assigned_level = "INTERMEDIATE"
        else:
            assigned_level = "BEGINNER"

        topic_results = []
        now = datetime.now(timezone.utc)

        for concept, stats in topic_counts.items():
            rate = stats["correct"] / stats["total"] if stats["total"] > 0 else 0
            status = "Strong" if rate >= 0.75 else ("Medium" if rate >= 0.5 else "Weak")
            topic_results.append({
                "topic": concept,
                "status": status,
                "score": int(rate * 100)
            })

            mastery = db.query(ConceptMastery).filter(
                ConceptMastery.student_id == student_id,
                ConceptMastery.subject_id == subject_id,
                ConceptMastery.concept_name == concept
            ).first()

            if not mastery:
                mastery = ConceptMastery(
                    student_id=student_id,
                    subject_id=subject_id,
                    concept_name=concept,
                    status=status.upper(),
                    score=int(rate * 100),
                    mistakes_count=stats["total"] - stats["correct"],
                    last_evaluated_at=now
                )
                db.add(mastery)
            else:
                mastery.score = int(rate * 100)
                mastery.status = status.upper()
                mastery.mistakes_count = stats["total"] - stats["correct"]
                mastery.last_evaluated_at = now

            if status == "Weak":
                existing_rev = db.query(RevisionItem).filter(
                    RevisionItem.student_id == student_id,
                    RevisionItem.subject_id == subject_id,
                    RevisionItem.topic_name == concept,
                    RevisionItem.is_completed == False
                ).first()
                if not existing_rev:
                    rev = RevisionItem(
                        student_id=student_id,
                        subject_id=subject_id,
                        topic_name=concept,
                        priority="HIGH",
                        reason=f"Diagnostic indicated weak baseline in {concept}",
                        is_completed=False,
                        due_date=now
                    )
                    db.add(rev)

        assessment = DiagnosticAssessment(
            student_id=student_id,
            subject_id=subject_id,
            total_score=score,
            max_score=total_questions,
            percentage=percentage,
            assigned_level=assigned_level,
            topic_results=topic_results,
            completed_at=now
        )
        db.add(assessment)

        profile = db.query(StudentLearningProfile).filter(
            StudentLearningProfile.student_id == student_id
        ).first()

        if not profile:
            profile = StudentLearningProfile(
                student_id=student_id,
                knowledge_level=assigned_level,
                overall_progress=min(100, int(percentage * 0.2)),
                quiz_accuracy=percentage,
                last_active_date=now
            )
            db.add(profile)
        else:
            profile.knowledge_level = assigned_level
            profile.last_active_date = now

        db.commit()
        db.refresh(assessment)
        return assessment

    async def evaluate_chapter_diagnostic(
        self,
        student_id: str,
        chapter_id: str,
        answers: Dict[str, int],
        db: Session
    ) -> DiagnosticAssessment:
        questions = self.get_or_seed_chapter_diagnostic_questions(chapter_id, db)
        chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
        if not chapter:
            raise ValueError(f"Chapter {chapter_id} not found")

        subject_id = chapter.subject_id
        pk_questions = [q for q in questions if q.question_type == "PRIOR_KNOWLEDGE"]
        total_pk = len(pk_questions)

        score = 0
        topic_counts: Dict[str, Dict[str, int]] = {}
        perception_data: Dict[str, Any] = {}

        for q in questions:
            selected = answers.get(q.id, -1)
            if q.question_type == "PRIOR_KNOWLEDGE":
                concept = q.concept
                if concept not in topic_counts:
                    topic_counts[concept] = {"correct": 0, "total": 0}
                topic_counts[concept]["total"] += 1
                if selected == q.correct_option_index:
                    score += 1
                    topic_counts[concept]["correct"] += 1
            elif q.question_type == "DIFFICULTY_PERCEPTION":
                opt_str = q.options[selected] if (0 <= selected < len(q.options)) else "Manageable"
                perception_data["perceived_difficulty"] = opt_str
            elif q.question_type == "INTEREST_LEVEL":
                opt_str = q.options[selected] if (0 <= selected < len(q.options)) else "3 - Moderate interest"
                perception_data["interest_scale"] = opt_str
            elif q.question_type == "VISUAL_PREFERENCE":
                opt_str = q.options[selected] if (0 <= selected < len(q.options)) else "Short explanations"
                perception_data["visual_preference"] = opt_str
            elif q.question_type == "REAL_WORLD_INTEREST":
                opt_str = q.options[selected] if (0 <= selected < len(q.options)) else "Yes, definitely"
                perception_data["real_world_preference"] = opt_str

        percentage = round((score / total_pk) * 100.0, 1) if total_pk > 0 else 50.0

        # Contradiction Detection: Student says "Easy" but scores low on prior knowledge
        perceived_diff = perception_data.get("perceived_difficulty", "")
        is_overconfident = ("Easy" in perceived_diff or "Manageable" in perceived_diff) and (percentage < 60.0)
        is_underconfident = ("difficult" in perceived_diff.lower()) and (percentage >= 80.0)

        # Baseline signal determination
        if percentage >= 80.0 and not is_overconfident:
            base_knowledge = "advanced"
            base_complexity = "detailed"
            base_density = "high"
        elif percentage >= 50.0:
            base_knowledge = "intermediate"
            base_complexity = "moderate"
            base_density = "medium"
        else:
            base_knowledge = "foundational"
            base_complexity = "simple"
            base_density = "low"

        if is_overconfident:
            base_knowledge = "foundational"
            base_complexity = "simple"
            base_density = "low"

        interest_str = perception_data.get("interest_scale", "")
        interest_level = "low" if ("1" in interest_str or "2" in interest_str) else ("high" if ("4" in interest_str or "5" in interest_str) else "medium")

        vis_str = perception_data.get("visual_preference", "")
        visual_need = "high" if ("Diagram" in vis_str or "Flowchart" in vis_str) else "medium"

        rw_str = perception_data.get("real_world_preference", "")
        rw_interest = "high" if ("Yes" in rw_str) else ("low" if ("Not" in rw_str) else "medium")

        # Synthesize Profile via Gemini API if key is present
        api_key = os.getenv("GEMINI_API_KEY")
        learner_profile = None
        student_explanation = None

        if api_key:
            try:
                system_prompt = (
                    "You are MindForge's adaptive educational intelligence. Analyze the student's diagnostic performance and preference signals "
                    "for a chapter and output a valid JSON object representing their chapter learner profile and a friendly student explanation."
                )
                user_prompt = (
                    f"Chapter Title: {chapter.title}\n"
                    f"Prior Knowledge Test Score: {score}/{total_pk} ({percentage}%)\n"
                    f"Perceived Difficulty: {perceived_diff}\n"
                    f"Interest Level: {interest_str}\n"
                    f"Visual Preference: {vis_str}\n"
                    f"Real-World Preference: {rw_str}\n"
                    f"Contradiction Flag (Overconfident): {is_overconfident}\n"
                    f"Contradiction Flag (Underconfident): {is_underconfident}\n\n"
                    "Return ONLY JSON matching this format:\n"
                    "{\n"
                    '  "knowledge_level": "foundational" | "intermediate" | "advanced",\n'
                    '  "difficulty_level": "low" | "moderate" | "high",\n'
                    '  "interest_level": "low" | "medium" | "high",\n'
                    '  "visual_support_need": "low" | "medium" | "high",\n'
                    '  "real_world_interest": "low" | "medium" | "high",\n'
                    '  "content_density": "low" | "medium" | "high",\n'
                    '  "explanation_complexity": "simple" | "moderate" | "detailed",\n'
                    '  "example_frequency": "high" | "moderate" | "low",\n'
                    '  "memory_support": "high" | "medium" | "low",\n'
                    '  "contradiction_flag": true | false,\n'
                    '  "student_explanation": "Friendly non-technical explanation to show student..."\n'
                    "}"
                )

                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(
                        url,
                        json={
                            "contents": [{"parts": [{"text": f"{system_prompt}\n\n{user_prompt}"}]}],
                            "generationConfig": {"temperature": 0.2, "response_mime_type": "application/json"}
                        }
                    )
                    if resp.status_code == 200:
                        raw_json = resp.json().get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        if raw_json:
                            parsed = json.loads(raw_json)
                            learner_profile = {
                                "knowledge_level": parsed.get("knowledge_level", base_knowledge),
                                "difficulty_level": parsed.get("difficulty_level", "high" if "difficult" in perceived_diff.lower() else "moderate"),
                                "interest_level": parsed.get("interest_level", interest_level),
                                "visual_support_need": parsed.get("visual_support_need", visual_need),
                                "real_world_interest": parsed.get("real_world_interest", rw_interest),
                                "content_density": parsed.get("content_density", base_density),
                                "explanation_complexity": parsed.get("explanation_complexity", base_complexity),
                                "example_frequency": parsed.get("example_frequency", "high" if interest_level == "low" else "moderate"),
                                "memory_support": parsed.get("memory_support", "high" if base_knowledge == "foundational" else "medium"),
                                "contradiction_flag": is_overconfident or is_underconfident,
                                "confidence_score": round(percentage / 100.0, 2)
                            }
                            student_explanation = parsed.get("student_explanation")
            except Exception as e:
                print(f"[Diagnostic] Gemini AI profiling fallback triggered: {e}")

        # Fallback profile synthesis if Gemini unavailable or failed
        if not learner_profile:
            if is_overconfident:
                explanation_msg = "MindForge noticed that some baseline concepts need strengthening, so we'll start with the foundations to build confidence."
            elif base_knowledge == "advanced":
                explanation_msg = "You already have a strong foundation in this topic! We'll move straight into deeper concepts and application challenges."
            else:
                explanation_msg = "We'll break this chapter into clear, approachable steps with visual comparisons and practical examples."

            learner_profile = {
                "knowledge_level": base_knowledge,
                "difficulty_level": "high" if ("difficult" in perceived_diff.lower() or is_overconfident) else ("low" if base_knowledge == "advanced" else "moderate"),
                "interest_level": interest_level,
                "visual_support_need": visual_need,
                "real_world_interest": rw_interest,
                "content_density": base_density,
                "explanation_complexity": base_complexity,
                "example_frequency": "high" if (interest_level == "low" or base_knowledge == "foundational") else "moderate",
                "memory_support": "high" if (base_knowledge == "foundational" or "difficult" in perceived_diff.lower()) else "medium",
                "contradiction_flag": is_overconfident or is_underconfident,
                "confidence_score": round(percentage / 100.0, 2)
            }
            student_explanation = explanation_msg

        # Topic Breakdown
        topic_results = []
        for concept, stats in topic_counts.items():
            rate = stats["correct"] / stats["total"] if stats["total"] > 0 else 0
            status = "Strong" if rate >= 0.75 else ("Medium" if rate >= 0.5 else "Weak")
            topic_results.append({
                "topic": concept,
                "status": status,
                "score": int(rate * 100)
            })

            # Update ConceptMastery record
            mastery = db.query(ConceptMastery).filter(
                ConceptMastery.student_id == student_id,
                ConceptMastery.subject_id == subject_id,
                ConceptMastery.concept_name == concept
            ).first()

            now = datetime.now(timezone.utc)
            if not mastery:
                mastery = ConceptMastery(
                    student_id=student_id,
                    subject_id=subject_id,
                    concept_name=concept,
                    status=status.upper(),
                    score=int(rate * 100),
                    mistakes_count=stats["total"] - stats["correct"],
                    last_evaluated_at=now
                )
                db.add(mastery)
            else:
                mastery.score = int(rate * 100)
                mastery.status = status.upper()
                mastery.mistakes_count = stats["total"] - stats["correct"]
                mastery.last_evaluated_at = now

            if status == "Weak":
                existing_rev = db.query(RevisionItem).filter(
                    RevisionItem.student_id == student_id,
                    RevisionItem.subject_id == subject_id,
                    RevisionItem.topic_name == concept,
                    RevisionItem.is_completed == False
                ).first()
                if not existing_rev:
                    rev = RevisionItem(
                        student_id=student_id,
                        subject_id=subject_id,
                        topic_name=concept,
                        priority="HIGH",
                        reason=f"Diagnostic indicated weak baseline in {concept}",
                        is_completed=False,
                        due_date=now
                    )
                    db.add(rev)

        assigned_level = base_knowledge.upper()

        # Save Diagnostic Assessment with Chapter ID & Learner Profile
        assessment = DiagnosticAssessment(
            student_id=student_id,
            subject_id=subject_id,
            chapter_id=chapter_id,
            total_score=score,
            max_score=total_pk,
            percentage=percentage,
            assigned_level=assigned_level,
            topic_results=topic_results,
            learner_profile=learner_profile,
            student_explanation=student_explanation,
            completed_at=datetime.now(timezone.utc)
        )
        db.add(assessment)

        # Persist chapter profile into StudentLearningProfile.learning_preferences
        profile = db.query(StudentLearningProfile).filter(
            StudentLearningProfile.student_id == student_id
        ).first()

        if not profile:
            profile = StudentLearningProfile(
                student_id=student_id,
                knowledge_level=assigned_level,
                overall_progress=min(100, int(percentage * 0.2)),
                quiz_accuracy=percentage,
                learning_preferences={chapter_id: learner_profile},
                last_active_date=datetime.now(timezone.utc)
            )
            db.add(profile)
        else:
            profile.knowledge_level = assigned_level
            current_prefs = dict(profile.learning_preferences or {})
            current_prefs[chapter_id] = learner_profile
            profile.learning_preferences = current_prefs
            profile.last_active_date = datetime.now(timezone.utc)

        db.commit()
        db.refresh(assessment)
        return assessment

diagnostic_service = DiagnosticService()
