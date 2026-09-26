from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.deps import get_db, get_current_student
from app.models.user import Student
from app.models.academic import Subject
from app.models.learning_engine import DiagnosticAssessment
from app.schemas.learning_engine import (
    DiagnosticQuestionOut,
    ChapterDiagnosticQuestionOut,
    DiagnosticSubmitIn,
    DiagnosticResultOut,
    TopicAssessmentResult,
    ChapterLearnerProfileOut
)
from app.services.diagnostic_service import diagnostic_service

router = APIRouter(prefix="/diagnostic", tags=["diagnostic"])

@router.get("/{subject_id}/questions", response_model=List[DiagnosticQuestionOut])
def get_diagnostic_questions(
    subject_id: str,
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student)
):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    questions = diagnostic_service.get_or_seed_diagnostic_questions(subject_id, db)
    return [
        DiagnosticQuestionOut(
            id=q.id,
            concept=q.concept,
            question=q.question,
            options=q.options,
            difficulty=q.difficulty
        )
        for q in questions
    ]

@router.post("/{subject_id}/submit", response_model=DiagnosticResultOut)
def submit_diagnostic_assessment(
    subject_id: str,
    payload: DiagnosticSubmitIn,
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student)
):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    try:
        assessment = diagnostic_service.evaluate_diagnostic(
            student_id=current_student.id,
            subject_id=subject_id,
            answers=payload.answers,
            db=db
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Identify first topic to recommend
    weakest = next((t["topic"] for t in assessment.topic_results if t["status"] == "Weak"), None)
    rec_topic = weakest or (assessment.topic_results[0]["topic"] if assessment.topic_results else "Basics")

    return DiagnosticResultOut(
        assessment_id=assessment.id,
        subject_id=assessment.subject_id,
        total_score=assessment.total_score,
        max_score=assessment.max_score,
        percentage=assessment.percentage,
        assigned_level=assessment.assigned_level,
        topic_results=[
            TopicAssessmentResult(topic=t["topic"], status=t["status"], score=t["score"])
            for t in assessment.topic_results
        ],
        recommended_starting_topic=rec_topic,
        completed_at=assessment.completed_at
    )

@router.get("/chapter/{chapter_id}/questions", response_model=List[ChapterDiagnosticQuestionOut])
def get_chapter_diagnostic_questions(
    chapter_id: str,
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student)
):
    questions = diagnostic_service.get_or_seed_chapter_diagnostic_questions(chapter_id, db)
    return [
        ChapterDiagnosticQuestionOut(
            id=q.id,
            concept=q.concept,
            question=q.question,
            options=q.options,
            difficulty=q.difficulty,
            question_type=q.question_type or "PRIOR_KNOWLEDGE"
        )
        for q in questions
    ]

@router.post("/chapter/{chapter_id}/submit", response_model=DiagnosticResultOut)
async def submit_chapter_diagnostic(
    chapter_id: str,
    payload: DiagnosticSubmitIn,
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student)
):
    try:
        assessment = await diagnostic_service.evaluate_chapter_diagnostic(
            student_id=current_student.id,
            chapter_id=chapter_id,
            answers=payload.answers,
            db=db
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    prof_out = None
    if assessment.learner_profile:
        prof_out = ChapterLearnerProfileOut(
            student_id=current_student.id,
            chapter_id=chapter_id,
            knowledge_level=assessment.learner_profile.get("knowledge_level", "foundational"),
            difficulty_level=assessment.learner_profile.get("difficulty_level", "moderate"),
            interest_level=assessment.learner_profile.get("interest_level", "medium"),
            visual_support_need=assessment.learner_profile.get("visual_support_need", "high"),
            real_world_interest=assessment.learner_profile.get("real_world_interest", "high"),
            content_density=assessment.learner_profile.get("content_density", "low"),
            explanation_complexity=assessment.learner_profile.get("explanation_complexity", "simple"),
            example_frequency=assessment.learner_profile.get("example_frequency", "high"),
            memory_support=assessment.learner_profile.get("memory_support", "high"),
            contradiction_flag=assessment.learner_profile.get("contradiction_flag", False),
            confidence_score=assessment.learner_profile.get("confidence_score", 1.0),
            student_explanation=assessment.student_explanation or "Adaptive lesson prepared.",
            completed_at=assessment.completed_at
        )

    return DiagnosticResultOut(
        assessment_id=assessment.id,
        subject_id=assessment.subject_id,
        chapter_id=assessment.chapter_id,
        total_score=assessment.total_score,
        max_score=assessment.max_score,
        percentage=assessment.percentage,
        assigned_level=assessment.assigned_level,
        topic_results=[
            TopicAssessmentResult(topic=t["topic"], status=t["status"], score=t["score"])
            for t in assessment.topic_results
        ],
        learner_profile=prof_out,
        student_explanation=assessment.student_explanation,
        recommended_starting_topic=None,
        completed_at=assessment.completed_at
    )

@router.get("/chapter/{chapter_id}/profile", response_model=Optional[ChapterLearnerProfileOut])
def get_chapter_learner_profile(
    chapter_id: str,
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student)
):
    assessment = db.query(DiagnosticAssessment).filter(
        DiagnosticAssessment.student_id == current_student.id,
        DiagnosticAssessment.chapter_id == chapter_id
    ).order_by(DiagnosticAssessment.completed_at.desc()).first()

    if not assessment or not assessment.learner_profile:
        return None

    lp = assessment.learner_profile
    return ChapterLearnerProfileOut(
        student_id=current_student.id,
        chapter_id=chapter_id,
        knowledge_level=lp.get("knowledge_level", "foundational"),
        difficulty_level=lp.get("difficulty_level", "moderate"),
        interest_level=lp.get("interest_level", "medium"),
        visual_support_need=lp.get("visual_support_need", "high"),
        real_world_interest=lp.get("real_world_interest", "high"),
        content_density=lp.get("content_density", "low"),
        explanation_complexity=lp.get("explanation_complexity", "simple"),
        example_frequency=lp.get("example_frequency", "high"),
        memory_support=lp.get("memory_support", "high"),
        contradiction_flag=lp.get("contradiction_flag", False),
        confidence_score=lp.get("confidence_score", 1.0),
        student_explanation=assessment.student_explanation or "Adaptive lesson prepared.",
        completed_at=assessment.completed_at
    )
