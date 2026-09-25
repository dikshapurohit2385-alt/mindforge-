from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.deps import get_db, get_current_teacher
from app.models.user import Teacher
from app.models.academic import Subject
from app.models.learning_engine import (
    Quiz,
    QuizQuestion,
    Flashcard
)
from app.schemas.learning_engine import (
    TeacherAnalyticsOverviewOut,
    StudentCohortItemOut,
    StudentAnalyticsDetailOut,
    TeacherAssistantGenerateIn,
    TeacherAssistantGenerateOut,
    TeacherPublishQuizIn,
    TeacherPublishFlashcardsIn,
    StudentAttentionItem,
    TopicDifficultyItem
)
from app.services.teacher_analytics_service import teacher_analytics_service

router = APIRouter(prefix="/teacher", tags=["teacher-analytics"])

@router.get("/analytics/overview", response_model=TeacherAnalyticsOverviewOut)
def get_teacher_overview(
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    data = teacher_analytics_service.get_overview_metrics(
        teacher_id=current_teacher.id,
        db=db
    )
    return TeacherAnalyticsOverviewOut(
        total_students=data["total_students"],
        average_class_progress=data["average_class_progress"],
        average_quiz_accuracy=data["average_quiz_accuracy"],
        students_needing_attention=[
            StudentAttentionItem(**s) for s in data["students_needing_attention"]
        ],
        most_difficult_topics=[
            TopicDifficultyItem(**t) for t in data["most_difficult_topics"]
        ],
        most_improved_topics=[
            TopicDifficultyItem(**t) for t in data["most_improved_topics"]
        ]
    )

@router.get("/analytics/students", response_model=List[StudentCohortItemOut])
def get_cohort_analytics(
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    cohort = teacher_analytics_service.get_student_cohort(db=db)
    return [StudentCohortItemOut(**s) for s in cohort]

@router.get("/analytics/students/{student_id}", response_model=StudentAnalyticsDetailOut)
def get_student_detail_analytics(
    student_id: str,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    try:
        detail = teacher_analytics_service.get_individual_student_analytics(
            student_id=student_id,
            db=db
        )
        return StudentAnalyticsDetailOut(**detail)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/assistant/generate", response_model=TeacherAssistantGenerateOut)
async def generate_teacher_content(
    payload: TeacherAssistantGenerateIn,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    data = await teacher_analytics_service.generate_content(
        content_type=payload.content_type,
        topic=payload.topic,
        difficulty=payload.difficulty,
        item_count=payload.item_count,
        instructions=payload.additional_instructions
    )
    return TeacherAssistantGenerateOut(
        content_type=payload.content_type,
        topic=payload.topic,
        difficulty=payload.difficulty,
        generated_data=data
    )

@router.post("/assistant/publish-quiz")
def publish_teacher_quiz(
    payload: TeacherPublishQuizIn,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    subject = db.query(Subject).filter(Subject.id == payload.subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    quiz = Quiz(
        title=payload.title,
        subject_id=payload.subject_id,
        chapter_id=payload.chapter_id,
        module_id=payload.module_id,
        difficulty=payload.difficulty,
        is_ai_generated=False,
        is_published=True,
        created_by=current_teacher.id
    )
    db.add(quiz)
    db.flush()

    for q in payload.questions:
        qq = QuizQuestion(
            quiz_id=quiz.id,
            question=q["question"],
            options=q["options"],
            correct_option_index=q.get("correct_option_index", 0),
            explanation=q.get("explanation"),
            concept_tag=q.get("concept_tag", payload.title),
            difficulty=q.get("difficulty", payload.difficulty)
        )
        db.add(qq)

    db.commit()
    db.refresh(quiz)
    return {"status": "success", "message": f"Quiz '{quiz.title}' published successfully.", "quiz_id": quiz.id}

@router.post("/assistant/publish-flashcards")
def publish_teacher_flashcards(
    payload: TeacherPublishFlashcardsIn,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    subject = db.query(Subject).filter(Subject.id == payload.subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    created = 0
    for fc in payload.flashcards:
        card = Flashcard(
            subject_id=payload.subject_id,
            chapter_id=payload.chapter_id,
            module_id=payload.module_id,
            front_question=fc["front_question"],
            back_answer=fc["back_answer"],
            concept_tag=fc.get("concept_tag", "General"),
            difficulty=fc.get("difficulty", "MEDIUM"),
            created_by=current_teacher.id
        )
        db.add(card)
        created += 1

    db.commit()
    return {"status": "success", "message": f"{created} flashcards published successfully."}
