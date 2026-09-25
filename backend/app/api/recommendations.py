from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.deps import get_db, get_current_student
from app.models.user import Student
from app.models.learning_engine import StudentRecommendation
from app.schemas.learning_engine import RecommendationOut
from app.services.recommendation_engine import recommendation_engine

router = APIRouter(prefix="/recommendations", tags=["recommendations"])

@router.get("", response_model=List[RecommendationOut])
def get_student_recommendations(
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student)
):
    recs = recommendation_engine.compute_recommendations(
        student_id=current_student.id,
        db=db
    )
    return [
        RecommendationOut(
            id=r.id,
            title=r.title,
            description=r.description,
            action_type=r.action_type,
            target_url=r.target_url,
            priority=r.priority,
            reason=r.reason,
            created_at=r.created_at
        )
        for r in recs
    ]

@router.post("/{id}/dismiss")
def dismiss_recommendation(
    id: str,
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student)
):
    rec = db.query(StudentRecommendation).filter(
        StudentRecommendation.id == id,
        StudentRecommendation.student_id == current_student.id
    ).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    rec.is_completed = True
    db.commit()
    return {"status": "success", "message": "Recommendation dismissed."}
