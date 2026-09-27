from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.deps import get_db, get_current_user, get_current_teacher
from app.models.user import User, Teacher, Student, UserRole
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
        class_id=subject.class_id,
        class_name=subject.class_name,
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
        teacher_id=current_teacher.id,
        class_id=subject_in.class_id,
        class_name=subject_in.class_name
    )
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return format_subject_out(subject, db)

@router.get("", response_model=List[SubjectOut])
def list_subjects(
    class_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Subject)
    # If student, strictly isolate and return only subjects for the student's enrolled class
    if current_user.role == UserRole.STUDENT:
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
        if student and student.class_id:
            query = query.filter(Subject.class_id == student.class_id)
        elif student and student.class_name:
            query = query.filter(Subject.class_name == student.class_name)
    elif class_id:
        query = query.filter(Subject.class_id == class_id)

    subjects = query.all()
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
    
    if subject_in.name is not None:
        subject.name = subject_in.name
    if subject_in.description is not None:
        subject.description = subject_in.description
    if subject_in.class_id is not None:
        subject.class_id = subject_in.class_id
    if subject_in.class_name is not None:
        subject.class_name = subject_in.class_name

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

    db.delete(subject)
    db.commit()
    return None
