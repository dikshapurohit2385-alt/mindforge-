from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.deps import get_db, get_current_user, get_current_teacher
from app.models.user import User, Teacher, UserRole
from app.models.academic import Subject
from app.schemas.academic import SubjectCreate, SubjectUpdate, SubjectOut

router = APIRouter(prefix="/subjects", tags=["subjects"])

def format_subject_out(subject: Subject, db: Session) -> SubjectOut:
    teacher_name = "Unknown Teacher"
    if subject.teacher and subject.teacher.user:
        teacher_name = subject.teacher.user.name
    
    chapter_cnt = len(subject.chapters) if subject.chapters else 0
    return SubjectOut(
        id=subject.id,
        name=subject.name,
        description=subject.description,
        teacher_id=subject.teacher_id,
        teacher_name=teacher_name,
        chapter_count=chapter_cnt,
        chapters=subject.chapters or [],
        created_at=subject.created_at
    )

@router.post("", response_model=SubjectOut, status_code=status.HTTP_201_CREATED)
def create_subject(
    subject_in: SubjectCreate,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    subject = Subject(
        name=subject_in.name,
        description=subject_in.description,
        teacher_id=current_teacher.id
    )
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return format_subject_out(subject, db)

@router.get("", response_model=List[SubjectOut])
def list_subjects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # If teacher, return subjects taught by teacher or all subjects
    subjects = db.query(Subject).all()
    return [format_subject_out(s, db) for s in subjects]

@router.get("/{id}", response_model=SubjectOut)
def get_subject(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    subject = db.query(Subject).filter(Subject.id == id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    return format_subject_out(subject, db)

@router.put("/{id}", response_model=SubjectOut)
def update_subject(
    id: str,
    subject_in: SubjectUpdate,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    subject = db.query(Subject).filter(Subject.id == id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    if subject.teacher_id != current_teacher.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this subject")
    
    if subject_in.name is not None:
        subject.name = subject_in.name
    if subject_in.description is not None:
        subject.description = subject_in.description

    db.commit()
    db.refresh(subject)
    return format_subject_out(subject, db)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subject(
    id: str,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    subject = db.query(Subject).filter(Subject.id == id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    if subject.teacher_id != current_teacher.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this subject")

    db.delete(subject)
    db.commit()
    return None
