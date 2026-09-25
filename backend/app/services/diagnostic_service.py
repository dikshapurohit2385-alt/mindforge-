from datetime import datetime, timezone
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.learning_engine import (
    DiagnosticQuestion,
    DiagnosticAssessment,
    ConceptMastery,
    StudentLearningProfile,
    RevisionItem
)
from app.models.academic import Subject

class DiagnosticService:
    def get_or_seed_diagnostic_questions(self, subject_id: str, db: Session) -> List[DiagnosticQuestion]:
        questions = db.query(DiagnosticQuestion).filter(
            DiagnosticQuestion.subject_id == subject_id
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
                    explanation=s["exp"]
                )
                db.add(q)
                created.append(q)

            db.commit()
            for q in created:
                db.refresh(q)
            questions = created

        return questions

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
            raise ValueError("No diagnostic questions found for subject")

        score = 0
        topic_counts: Dict[str, Dict[str, int]] = {}

        for q in questions:
            concept = q.concept
            if concept not in topic_counts:
                topic_counts[concept] = {"correct": 0, "total": 0}
            topic_counts[concept]["total"] += 1

            selected = answers.get(q.id, -1)
            if selected == q.correct_option_index:
                score += 1
                topic_counts[concept]["correct"] += 1

        percentage = round((score / total_questions) * 100.0, 1)

        # Knowledge Level Assignment
        if percentage >= 80.0:
            assigned_level = "ADVANCED"
        elif percentage >= 50.0:
            assigned_level = "INTERMEDIATE"
        else:
            assigned_level = "BEGINNER"

        # Topic Breakdown
        topic_results = []
        for concept, stats in topic_counts.items():
            rate = stats["correct"] / stats["total"]
            if stats["total"] == 0:
                status = "Unknown"
            elif rate >= 0.75:
                status = "Strong"
            elif rate >= 0.5:
                status = "Medium"
            else:
                status = "Weak"

            topic_results.append({
                "topic": concept,
                "status": status,
                "score": int(rate * 100)
            })

            # Update or create ConceptMastery record
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

            # If Weak, schedule in Revision Queue
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
                        reason=f"Diagnostic assessment indicated weak baseline in {concept}",
                        is_completed=False,
                        due_date=now
                    )
                    db.add(rev)

        # Record Diagnostic Assessment
        assessment = DiagnosticAssessment(
            student_id=student_id,
            subject_id=subject_id,
            total_score=score,
            max_score=total_questions,
            percentage=percentage,
            assigned_level=assigned_level,
            topic_results=topic_results,
            completed_at=datetime.now(timezone.utc)
        )
        db.add(assessment)

        # Update Student Profile
        profile = db.query(StudentLearningProfile).filter(
            StudentLearningProfile.student_id == student_id
        ).first()

        if not profile:
            profile = StudentLearningProfile(
                student_id=student_id,
                knowledge_level=assigned_level,
                overall_progress=min(100, int(percentage * 0.2)),
                quiz_accuracy=percentage,
                last_active_date=datetime.now(timezone.utc)
            )
            db.add(profile)
        else:
            profile.knowledge_level = assigned_level
            profile.last_active_date = datetime.now(timezone.utc)

        db.commit()
        db.refresh(assessment)
        return assessment

diagnostic_service = DiagnosticService()
