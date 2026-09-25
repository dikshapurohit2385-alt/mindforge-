from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.deps import get_db, get_current_student
from app.models.user import Student
from app.models.academic import Subject, Module
from app.models.learning_engine import (
    ModuleCompletion,
    StudentLearningProfile,
    ConceptMastery
)
from app.schemas.learning_engine import LearningPathOut
from app.services.knowledge_graph_service import knowledge_graph_service

router = APIRouter(prefix="/learning-path", tags=["learning-path"])

@router.get("/{subject_id}", response_model=LearningPathOut)
def get_adaptive_learning_path(
    subject_id: str,
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student)
):
    try:
        path_data = knowledge_graph_service.generate_adaptive_learning_path(
            student_id=current_student.id,
            subject_id=subject_id,
            db=db
        )
        return path_data
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate learning path: {str(e)}")

@router.post("/module/{module_id}/complete")
def mark_module_completed(
    module_id: str,
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student)
):
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    existing = db.query(ModuleCompletion).filter(
        ModuleCompletion.student_id == current_student.id,
        ModuleCompletion.module_id == module_id
    ).first()

    now = datetime.now(timezone.utc)
    if not existing:
        comp = ModuleCompletion(
            student_id=current_student.id,
            module_id=module_id,
            completed_at=now
        )
        db.add(comp)

        # Update concept mastery to at least Medium/Strong
        mastery = db.query(ConceptMastery).filter(
            ConceptMastery.student_id == current_student.id,
            ConceptMastery.concept_name == module.title
        ).first()

        subject_id = module.chapter.subject_id if module.chapter else None
        if not mastery and subject_id:
            mastery = ConceptMastery(
                student_id=current_student.id,
                subject_id=subject_id,
                concept_name=module.title,
                status="STRONG",
                score=90,
                mistakes_count=0,
                last_evaluated_at=now
            )
            db.add(mastery)
        elif mastery and mastery.status != "STRONG":
            mastery.status = "STRONG"
            mastery.score = max(mastery.score, 85)
            mastery.last_evaluated_at = now

        # Update profile overall progress
        profile = db.query(StudentLearningProfile).filter(
            StudentLearningProfile.student_id == current_student.id
        ).first()
        if profile:
            total_modules = db.query(Module).count()
            completed_modules = db.query(ModuleCompletion).filter(
                ModuleCompletion.student_id == current_student.id
            ).count() + 1
            if total_modules > 0:
                profile.overall_progress = min(100, int((completed_modules / total_modules) * 100))
            profile.last_active_date = now

        db.commit()

    return {"status": "success", "message": f"Module '{module.title}' marked as completed."}
