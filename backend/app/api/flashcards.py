from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.deps import get_db, get_current_student
from app.models.user import Student
from app.models.academic import Subject
from app.models.learning_engine import Flashcard, FlashcardReview
from app.schemas.learning_engine import (
    FlashcardOut,
    FlashcardReviewIn,
    FlashcardGenerateIn
)
from app.services.adaptive_learning_service import adaptive_learning_service

router = APIRouter(prefix="/flashcards", tags=["flashcards"])

@router.get("", response_model=List[FlashcardOut])
def get_flashcards(
    subject_id: Optional[str] = Query(None),
    module_id: Optional[str] = Query(None),
    due_only: bool = Query(False),
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student)
):
    query = db.query(Flashcard)
    if subject_id:
        query = query.filter(Flashcard.subject_id == subject_id)
    if module_id:
        query = query.filter(Flashcard.module_id == module_id)

    cards = query.all()
    now = datetime.now(timezone.utc)

    # Attach student's review data
    reviews = {
        r.flashcard_id: r for r in db.query(FlashcardReview).filter(
            FlashcardReview.student_id == current_student.id
        ).all()
    }

    result = []
    for c in cards:
        r = reviews.get(c.id)
        is_due = True
        interval = 1
        reps = 0
        next_due = None
        if r:
            interval = r.interval_days
            reps = r.repetitions
            next_due = r.next_review_due
            # Determine if due
            if r.next_review_due and r.next_review_due > now:
                is_due = False

        if due_only and not is_due:
            continue

        result.append(FlashcardOut(
            id=c.id,
            subject_id=c.subject_id,
            subject_name=c.subject.name if c.subject else None,
            chapter_id=c.chapter_id,
            module_id=c.module_id,
            front_question=c.front_question,
            back_answer=c.back_answer,
            concept_tag=c.concept_tag,
            difficulty=c.difficulty,
            interval_days=interval,
            repetitions=reps,
            next_review_due=next_due,
            is_due=is_due
        ))

    return result

@router.post("/generate", response_model=List[FlashcardOut])
def generate_ai_flashcards(
    payload: FlashcardGenerateIn,
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student)
):
    subject = db.query(Subject).filter(Subject.id == payload.subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    created = adaptive_learning_service.generate_flashcards(
        subject_id=payload.subject_id,
        module_id=payload.module_id,
        topic_title=payload.topic_title,
        count=payload.count,
        db=db
    )

    return [
        FlashcardOut(
            id=c.id,
            subject_id=c.subject_id,
            subject_name=subject.name,
            chapter_id=c.chapter_id,
            module_id=c.module_id,
            front_question=c.front_question,
            back_answer=c.back_answer,
            concept_tag=c.concept_tag,
            difficulty=c.difficulty,
            interval_days=1,
            repetitions=0,
            next_review_due=datetime.now(timezone.utc),
            is_due=True
        )
        for c in created
    ]

@router.post("/{id}/review")
def review_flashcard(
    id: str,
    payload: FlashcardReviewIn,
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student)
):
    card = db.query(Flashcard).filter(Flashcard.id == id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Flashcard not found")

    review = adaptive_learning_service.review_flashcard(
        student_id=current_student.id,
        flashcard_id=id,
        rating=payload.rating,
        db=db
    )

    return {
        "status": "success",
        "rating": review.rating,
        "repetitions": review.repetitions,
        "interval_days": review.interval_days,
        "ease_factor": review.ease_factor,
        "next_review_due": review.next_review_due
    }
