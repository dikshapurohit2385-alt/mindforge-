from datetime import datetime, timezone
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.learning_engine import (
    StudentLearningProfile,
    ConceptMastery,
    RevisionItem,
    FlashcardReview,
    QuizAttempt,
    ModuleCompletion,
    StudentRecommendation
)
from app.models.academic import Subject, Module

class RecommendationEngine:
    def compute_recommendations(self, student_id: str, db: Session) -> List[StudentRecommendation]:
        """
        Synthesizes student data (profile, quizzes, mastery, revision, flashcards)
        into ranked, actionable recommendations.
        """
        # Clear dismissed or old completed recommendations
        db.query(StudentRecommendation).filter(
            StudentRecommendation.student_id == student_id,
            StudentRecommendation.is_completed == True
        ).delete()

        recommendations = []

        # 1. Check Active Revision Queue (Highest Priority)
        urgent_revision = db.query(RevisionItem).filter(
            RevisionItem.student_id == student_id,
            RevisionItem.is_completed == False,
            RevisionItem.priority == "HIGH"
        ).first()

        if urgent_revision:
            rec = StudentRecommendation(
                student_id=student_id,
                title=f"Revise {urgent_revision.topic_name}",
                description=f"High priority: {urgent_revision.reason}. Refresh this concept to prevent forgetting.",
                action_type="REVISE",
                target_url=f"/student/subjects/{urgent_revision.subject_id}",
                priority="HIGH",
                reason=urgent_revision.reason
            )
            recommendations.append(rec)

        # 2. Check Due Flashcards (Spaced Repetition)
        now = datetime.now(timezone.utc)
        due_flashcards = db.query(FlashcardReview).filter(
            FlashcardReview.student_id == student_id,
            FlashcardReview.next_review_due <= now
        ).count()

        if due_flashcards > 0:
            rec = StudentRecommendation(
                student_id=student_id,
                title=f"Review {due_flashcards} Spaced Flashcards",
                description=f"You have {due_flashcards} flashcards scheduled for memory reinforcement today.",
                action_type="FLASHCARD",
                target_url="/student/flashcards",
                priority="HIGH" if due_flashcards > 5 else "MEDIUM",
                reason="Spaced repetition interval due for active recall"
            )
            recommendations.append(rec)

        # 3. Check Weak Concepts for Practice Quiz
        weak_concept = db.query(ConceptMastery).filter(
            ConceptMastery.student_id == student_id,
            ConceptMastery.status == "WEAK"
        ).order_by(ConceptMastery.mistakes_count.desc()).first()

        if weak_concept:
            rec = StudentRecommendation(
                student_id=student_id,
                title=f"Take Quiz on {weak_concept.concept_name}",
                description=f"Your mastery is currently {weak_concept.score}%. Take a short dynamic quiz to strengthen understanding.",
                action_type="QUIZ",
                target_url="/student/quizzes",
                priority="MEDIUM",
                reason=f"{weak_concept.mistakes_count} recorded mistakes in recent exercises"
            )
            recommendations.append(rec)

        # 4. Check Next Incomplete Module in Curriculum
        subjects = db.query(Subject).all()
        for subj in subjects:
            comp_mod_ids = [
                c.module_id for c in db.query(ModuleCompletion).filter(
                    ModuleCompletion.student_id == student_id
                ).all()
            ]

            next_mod = db.query(Module).join(Module.chapter).filter(
                Module.chapter.has(subject_id=subj.id),
                ~Module.id.in_(comp_mod_ids) if comp_mod_ids else True
            ).order_by(Module.order_index).first()

            if next_mod:
                rec = StudentRecommendation(
                    student_id=student_id,
                    title=f"Continue: {next_mod.title}",
                    description=f"Next step in {subj.name}. Explore lecture notes and start digital note-taking.",
                    action_type="LEARN",
                    target_url=f"/student/subjects/{subj.id}",
                    priority="MEDIUM",
                    reason="Curriculum progression prerequisites met"
                )
                recommendations.append(rec)
                break

        # Fallback if student is brand new
        if not recommendations:
            first_subject = db.query(Subject).first()
            if first_subject:
                rec = StudentRecommendation(
                    student_id=student_id,
                    title=f"Begin {first_subject.name} Diagnostic",
                    description="Take your diagnostic assessment to calibrate your personalized curriculum path.",
                    action_type="LEARN",
                    target_url=f"/student/diagnostic/{first_subject.id}",
                    priority="HIGH",
                    reason="Diagnostic needed to establish initial baseline knowledge"
                )
                recommendations.append(rec)

        # Save to DB for persistence
        db.query(StudentRecommendation).filter(
            StudentRecommendation.student_id == student_id
        ).delete()
        for r in recommendations[:4]:
            db.add(r)
        db.commit()

        return db.query(StudentRecommendation).filter(
            StudentRecommendation.student_id == student_id
        ).order_by(StudentRecommendation.created_at.desc()).all()

recommendation_engine = RecommendationEngine()
