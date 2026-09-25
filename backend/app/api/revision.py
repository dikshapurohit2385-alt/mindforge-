from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.deps import get_db, get_current_student
from app.models.user import Student
from app.models.learning_engine import RevisionItem
from app.schemas.learning_engine import RevisionItemOut

router = APIRouter(prefix="/revision", tags=["revision"])

@router.get("/queue", response_model=List[RevisionItemOut])
def get_revision_queue(
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student)
):
    items = db.query(RevisionItem).filter(
        RevisionItem.student_id == current_student.id,
        RevisionItem.is_completed == False
    ).order_by(
        RevisionItem.priority.desc(),
        RevisionItem.due_date.asc()
    ).all()

    return [
        RevisionItemOut(
            id=r.id,
            subject_id=r.subject_id,
            subject_name=r.subject.name if r.subject else "General",
            module_id=r.module_id,
            topic_name=r.topic_name,
            priority=r.priority,
            reason=r.reason,
            is_completed=r.is_completed,
            due_date=r.due_date,
            created_at=r.created_at
        )
        for r in items
    ]

@router.post("/{id}/complete")
def complete_revision_item(
    id: str,
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student)
):
    item = db.query(RevisionItem).filter(
        RevisionItem.id == id,
        RevisionItem.student_id == current_student.id
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="Revision item not found")

    item.is_completed = True
    db.commit()
    return {"status": "success", "message": f"Revision for '{item.topic_name}' completed."}
