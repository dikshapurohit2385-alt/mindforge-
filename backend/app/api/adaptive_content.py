from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.deps import get_db, get_current_student
from app.models.user import Student
from app.models.academic import Subject
from app.models.learning_engine import (
    PersonalizedNote,
    StudentLearningProfile
)
from app.schemas.learning_engine import (
    AdaptiveExplainIn,
    AdaptiveExplainOut,
    GenerateNotesIn,
    PersonalizedNoteOut,
    ChapterAdaptiveLessonOut
)
from app.services.adaptive_learning_service import adaptive_learning_service

router = APIRouter(prefix="/adaptive-content", tags=["adaptive-content"])

@router.get("/chapter/{chapter_id}/lesson", response_model=ChapterAdaptiveLessonOut)
async def get_chapter_adaptive_lesson(
    chapter_id: str,
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student)
):
    try:
        lesson = await adaptive_learning_service.generate_chapter_adaptive_lesson(
            student_id=current_student.id,
            chapter_id=chapter_id,
            db=db
        )
        return lesson
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/explain", response_model=AdaptiveExplainOut)
async def get_adaptive_explanation(
    payload: AdaptiveExplainIn,
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student)
):
    level = payload.explanation_level
    if not level:
        profile = db.query(StudentLearningProfile).filter(
            StudentLearningProfile.student_id == current_student.id
        ).first()
        level = profile.knowledge_level if profile else "INTERMEDIATE"

    res = await adaptive_learning_service.generate_explanation(
        topic=payload.topic_title,
        level=level,
        format_type=payload.format_type,
        custom_question=payload.custom_question
    )
    return res

@router.post("/generate-notes", response_model=PersonalizedNoteOut)
def generate_personalized_notes(
    payload: GenerateNotesIn,
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student)
):
    note = adaptive_learning_service.generate_personalized_notes(
        student_id=current_student.id,
        subject_id=payload.subject_id,
        module_id=payload.module_id,
        topic_title=payload.topic_title,
        db=db
    )
    subject = db.query(Subject).filter(Subject.id == payload.subject_id).first()

    return PersonalizedNoteOut(
        id=note.id,
        subject_id=note.subject_id,
        subject_name=subject.name if subject else None,
        module_id=note.module_id,
        topic_title=note.topic_title,
        overview=note.overview,
        key_concepts=note.key_concepts,
        simple_explanation=note.simple_explanation,
        important_definitions=note.important_definitions,
        examples=note.examples,
        common_mistakes=note.common_mistakes,
        quick_revision=note.quick_revision,
        created_at=note.created_at
    )

@router.get("/notes", response_model=List[PersonalizedNoteOut])
def get_personalized_notes(
    subject_id: Optional[str] = Query(None),
    module_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student)
):
    q = db.query(PersonalizedNote).filter(
        PersonalizedNote.student_id == current_student.id
    )
    if subject_id:
        q = q.filter(PersonalizedNote.subject_id == subject_id)
    if module_id:
        q = q.filter(PersonalizedNote.module_id == module_id)

    notes = q.order_by(PersonalizedNote.created_at.desc()).all()
    return [
        PersonalizedNoteOut(
            id=n.id,
            subject_id=n.subject_id,
            subject_name=n.subject.name if n.subject else None,
            module_id=n.module_id,
            topic_title=n.topic_title,
            overview=n.overview,
            key_concepts=n.key_concepts,
            simple_explanation=n.simple_explanation,
            important_definitions=n.important_definitions,
            examples=n.examples,
            common_mistakes=n.common_mistakes,
            quick_revision=n.quick_revision,
            created_at=n.created_at
        )
        for n in notes
    ]
