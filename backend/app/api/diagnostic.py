from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.deps import get_db, get_current_student
from app.models.user import Student
from app.models.academic import Subject
from app.models.learning_engine import DiagnosticAssessment
from app.schemas.learning_engine import (
    DiagnosticQuestionOut,
    DiagnosticSubmitIn,
    DiagnosticResultOut,
    TopicAssessmentResult
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

@router.get("/{subject_id}/history", response_model=List[DiagnosticResultOut])
def get_diagnostic_history(
    subject_id: str,
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student)
):
    assessments = db.query(DiagnosticAssessment).filter(
        DiagnosticAssessment.student_id == current_student.id,
        DiagnosticAssessment.subject_id == subject_id
    ).order_by(DiagnosticAssessment.completed_at.desc()).all()

    return [
        DiagnosticResultOut(
            assessment_id=a.id,
            subject_id=a.subject_id,
            total_score=a.total_score,
            max_score=a.max_score,
            percentage=a.percentage,
            assigned_level=a.assigned_level,
            topic_results=[
                TopicAssessmentResult(topic=t["topic"], status=t["status"], score=t["score"])
                for t in a.topic_results
            ],
            recommended_starting_topic=None,
            completed_at=a.completed_at
        )
        for a in assessments
    ]
