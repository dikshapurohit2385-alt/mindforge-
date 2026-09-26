from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.models.academic import SchoolClass, Subject
from app.schemas.academic import SchoolClassOut, SchoolClassCreate, SubjectOut

router = APIRouter(prefix="/classes", tags=["classes"])

@router.get("", response_model=List[SchoolClassOut])
def list_classes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    classes = db.query(SchoolClass).order_by(SchoolClass.grade_level.asc()).all()
    res = []
    for c in classes:
        sub_count = db.query(Subject).filter(Subject.class_id == c.id).count()
        res.append(
            SchoolClassOut(
                id=c.id,
                name=c.name,
                grade_level=c.grade_level,
                created_at=c.created_at,
                subject_count=sub_count
            )
        )
    return res

@router.post("", response_model=SchoolClassOut, status_code=status.HTTP_201_CREATED)
def create_class(
    payload: SchoolClassCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(SchoolClass).filter(SchoolClass.name == payload.name).first()
    if existing:
        return SchoolClassOut(
            id=existing.id,
            name=existing.name,
            grade_level=existing.grade_level,
            created_at=existing.created_at,
            subject_count=db.query(Subject).filter(Subject.class_id == existing.id).count()
        )

    sc = SchoolClass(
        name=payload.name,
        grade_level=payload.grade_level or 9
    )
    db.add(sc)
    db.commit()
    db.refresh(sc)

    return SchoolClassOut(
        id=sc.id,
        name=sc.name,
        grade_level=sc.grade_level,
        created_at=sc.created_at,
        subject_count=0
    )

@router.get("/{class_id}/subjects", response_model=List[SubjectOut])
def get_class_subjects(
    class_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sc = db.query(SchoolClass).filter(SchoolClass.id == class_id).first()
    if not sc:
        # Fallback search by class name if class_id is e.g. "Class 9"
        sc = db.query(SchoolClass).filter(SchoolClass.name == class_id).first()

    if sc:
        subjects = db.query(Subject).filter(Subject.class_id == sc.id).all()
    else:
        # Search by class_name string
        subjects = db.query(Subject).filter(Subject.class_name == class_id).all()

    if not subjects:
        # Return all subjects as fallback
        subjects = db.query(Subject).all()

    out = []
    for s in subjects:
        t_name = s.teacher.user.name if s.teacher and s.teacher.user else "Educator"
        out.append(
            SubjectOut(
                id=s.id,
                name=s.name,
                description=s.description,
                teacher_id=s.teacher_id,
                teacher_name=t_name,
                class_id=s.class_id,
                class_name=s.class_name or (sc.name if sc else None),
                chapter_count=len(s.chapters),
                chapters=[],
                created_at=s.created_at
            )
        )
    return out
