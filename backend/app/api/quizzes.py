from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.deps import get_db, get_current_student
from app.models.user import Student
from app.models.academic import Subject
from app.models.learning_engine import (
    Quiz,
    QuizQuestion,
    QuizAttempt
)
from app.schemas.learning_engine import (
    QuizDetailOut,
    QuizQuestionOut,
    QuizSubmitIn,
    QuizAttemptOut,
    QuizGenerateIn,
    GradedQuestionDetail
)
from app.services.adaptive_learning_service import adaptive_learning_service

router = APIRouter(prefix="/quizzes", tags=["quizzes"])

@router.get("", response_model=List[QuizDetailOut])
def list_quizzes(
    subject_id: Optional[str] = Query(None),
    module_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student)
):
    q = db.query(Quiz).filter(Quiz.is_published == True)
    if subject_id:
        q = q.filter(Quiz.subject_id == subject_id)
    if module_id:
        q = q.filter(Quiz.module_id == module_id)

    quizzes = q.order_by(Quiz.created_at.desc()).all()
    result = []
    for quiz in quizzes:
        questions = quiz.questions
        result.append(QuizDetailOut(
            id=quiz.id,
            title=quiz.title,
            subject_id=quiz.subject_id,
            subject_name=quiz.subject.name if quiz.subject else None,
            module_id=quiz.module_id,
            difficulty=quiz.difficulty,
            question_count=len(questions),
            questions=[
                QuizQuestionOut(
                    id=qq.id,
                    question=qq.question,
                    options=qq.options,
                    concept_tag=qq.concept_tag,
                    difficulty=qq.difficulty
                )
                for qq in questions
            ]
        ))
    return result

@router.get("/{id}", response_model=QuizDetailOut)
def get_quiz_detail(
    id: str,
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student)
):
    quiz = db.query(Quiz).filter(Quiz.id == id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    return QuizDetailOut(
        id=quiz.id,
        title=quiz.title,
        subject_id=quiz.subject_id,
        subject_name=quiz.subject.name if quiz.subject else None,
        module_id=quiz.module_id,
        difficulty=quiz.difficulty,
        question_count=len(quiz.questions),
        questions=[
            QuizQuestionOut(
                id=qq.id,
                question=qq.question,
                options=qq.options,
                concept_tag=qq.concept_tag,
                difficulty=qq.difficulty
            )
            for qq in quiz.questions
        ]
    )

@router.post("/generate", response_model=QuizDetailOut)
def generate_personalized_quiz(
    payload: QuizGenerateIn,
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student)
):
    subject = db.query(Subject).filter(Subject.id == payload.subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    quiz = adaptive_learning_service.generate_dynamic_quiz(
        student_id=current_student.id,
        subject_id=payload.subject_id,
        module_id=payload.module_id,
        topic_title=payload.topic_title,
        difficulty=payload.difficulty,
        question_count=payload.question_count,
        db=db
    )

    return QuizDetailOut(
        id=quiz.id,
        title=quiz.title,
        subject_id=quiz.subject_id,
        subject_name=subject.name,
        module_id=quiz.module_id,
        difficulty=quiz.difficulty,
        question_count=len(quiz.questions),
        questions=[
            QuizQuestionOut(
                id=qq.id,
                question=qq.question,
                options=qq.options,
                concept_tag=qq.concept_tag,
                difficulty=qq.difficulty
            )
            for qq in quiz.questions
        ]
    )

@router.post("/{id}/submit", response_model=QuizAttemptOut)
def submit_quiz_attempt(
    id: str,
    payload: QuizSubmitIn,
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student)
):
    try:
        res = adaptive_learning_service.grade_quiz_attempt(
            student_id=current_student.id,
            quiz_id=id,
            user_answers=payload.answers,
            db=db
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to grade quiz attempt: {str(e)}")

    attempt = res["attempt"]
    graded_details = res["graded_questions"]

    return QuizAttemptOut(
        id=attempt.id,
        quiz_id=attempt.quiz_id,
        score=attempt.score,
        max_score=attempt.max_score,
        percentage=attempt.percentage,
        concept_breakdown=attempt.concept_breakdown,
        graded_questions=[
            GradedQuestionDetail(
                question_id=g["question_id"],
                question=g["question"],
                options=g["options"],
                user_answer=g["user_answer"],
                correct_answer=g["correct_answer"],
                is_correct=g["is_correct"],
                explanation=g["explanation"],
                concept_tag=g["concept_tag"]
            )
            for g in graded_details
        ],
        recommendation=res["recommendation"],
        completed_at=attempt.completed_at
    )
