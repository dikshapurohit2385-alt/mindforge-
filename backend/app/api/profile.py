from datetime import datetime, timezone
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.deps import get_db, get_current_student
from app.models.user import Student
from app.models.learning_engine import (
    StudentLearningProfile,
    ConceptMastery,
    ModuleCompletion,
    RevisionItem,
    QuizAttempt
)
from app.schemas.learning_engine import (
    StudentProfileOut,
    ProfilePreferencesUpdate
)

router = APIRouter(prefix="/profile", tags=["profile"])

@router.get("/me", response_model=StudentProfileOut)
def get_my_learning_profile(
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student)
):
    profile = db.query(StudentLearningProfile).filter(
        StudentLearningProfile.student_id == current_student.id
    ).first()

    now = datetime.now(timezone.utc)
    if not profile:
        profile = StudentLearningProfile(
            student_id=current_student.id,
            knowledge_level="BEGINNER",
            learning_speed="MODERATE",
            preferred_content_format="SIMPLE",
            learning_preferences={},
            overall_progress=0,
            quiz_accuracy=0.0,
            streak_days=1,
            last_active_date=now
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

    # Concept Masteries
    masteries = db.query(ConceptMastery).filter(
        ConceptMastery.student_id == current_student.id
    ).all()

    strong = [m.concept_name for m in masteries if m.status == "STRONG"]
    weak = [m.concept_name for m in masteries if m.status == "WEAK"]

    frequently_incorrect = [
        {"concept": m.concept_name, "mistakes_count": m.mistakes_count, "score": m.score}
        for m in masteries if m.mistakes_count > 0
    ]
    frequently_incorrect.sort(key=lambda x: x["mistakes_count"], reverse=True)

    # Completed Topics
    completions = db.query(ModuleCompletion).filter(
        ModuleCompletion.student_id == current_student.id
    ).all()
    completed_topics = [c.module.title for c in completions if c.module]

    # Topics Requiring Revision
    revisions = db.query(RevisionItem).filter(
        RevisionItem.student_id == current_student.id,
        RevisionItem.is_completed == False
    ).all()
    topics_requiring_revision = [r.topic_name for r in revisions]

    return StudentProfileOut(
        id=profile.id,
        student_id=current_student.id,
        student_name=current_student.user.name if current_student.user else "Student",
        student_email=current_student.user.email if current_student.user else "",
        class_name=current_student.class_name,
        knowledge_level=profile.knowledge_level,
        learning_speed=profile.learning_speed,
        preferred_content_format=profile.preferred_content_format,
        learning_preferences=profile.learning_preferences or {},
        overall_progress=profile.overall_progress,
        quiz_accuracy=profile.quiz_accuracy,
        streak_days=profile.streak_days,
        strong_concepts=strong,
        weak_concepts=weak,
        frequently_incorrect_concepts=frequently_incorrect[:5],
        completed_topics=completed_topics,
        topics_requiring_revision=topics_requiring_revision,
        last_active_date=profile.last_active_date
    )

@router.put("/me/preferences", response_model=StudentProfileOut)
def update_learning_preferences(
    prefs: ProfilePreferencesUpdate,
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student)
):
    profile = db.query(StudentLearningProfile).filter(
        StudentLearningProfile.student_id == current_student.id
    ).first()

    if not profile:
        profile = StudentLearningProfile(student_id=current_student.id)
        db.add(profile)

    if prefs.learning_speed:
        profile.learning_speed = prefs.learning_speed.upper()
    if prefs.preferred_content_format:
        profile.preferred_content_format = prefs.preferred_content_format.upper()
    if prefs.learning_preferences is not None:
        merged = dict(profile.learning_preferences or {})
        merged.update(prefs.learning_preferences)
        profile.learning_preferences = merged

    profile.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(profile)

    return get_my_learning_profile(db=db, current_student=current_student)
