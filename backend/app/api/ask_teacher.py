from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.deps import get_db, get_current_user, get_current_student, get_current_teacher
from app.models.user import User, Student, Teacher
from app.models.academic import AskTeacherQuestion, Subject, QuestionStatus
from app.schemas.academic import QuestionCreate, QuestionAnswer, QuestionOut

router = APIRouter(prefix="/ask-teacher", tags=["ask-teacher"])

def format_question_out(q: AskTeacherQuestion) -> QuestionOut:
    student_name = q.student.user.name if q.student and q.student.user else "Student"
    teacher_name = q.teacher.user.name if q.teacher and q.teacher.user else "Teacher"
    subject_name = q.subject.name if q.subject else "Subject"
    chapter_title = q.chapter.title if q.chapter else None
    module_title = q.module.title if q.module else None

    return QuestionOut(
        id=q.id,
        student_id=q.student_id,
        student_name=student_name,
        teacher_id=q.teacher_id,
        teacher_name=teacher_name,
        subject_id=q.subject_id,
        subject_name=subject_name,
        chapter_id=q.chapter_id,
        chapter_title=chapter_title,
        module_id=q.module_id,
        module_title=module_title,
        selected_text=q.selected_text,
        question=q.question,
        answer=q.answer,
        status=q.status,
        created_at=q.created_at,
        answered_at=q.answered_at
    )

@router.post("/questions", response_model=QuestionOut, status_code=status.HTTP_201_CREATED)
@router.post("", response_model=QuestionOut, status_code=status.HTTP_201_CREATED)
def submit_question(
    q_in: QuestionCreate,
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student)
):
    subject = db.query(Subject).filter(Subject.id == q_in.subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    teacher_id = subject.teacher_id

    question = AskTeacherQuestion(
        student_id=current_student.id,
        teacher_id=teacher_id,
        subject_id=q_in.subject_id,
        chapter_id=q_in.chapter_id,
        module_id=q_in.module_id,
        selected_text=q_in.selected_text,
        question=q_in.question,
        status=QuestionStatus.PENDING
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    return format_question_out(question)

@router.get("/my-questions", response_model=List[QuestionOut])
@router.get("/student", response_model=List[QuestionOut])
def get_student_questions(
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student)
):
    questions = db.query(AskTeacherQuestion).filter(
        AskTeacherQuestion.student_id == current_student.id
    ).order_by(AskTeacherQuestion.created_at.desc()).all()
    return [format_question_out(q) for q in questions]

@router.get("/inbox", response_model=List[QuestionOut])
@router.get("/teacher", response_model=List[QuestionOut])
def get_teacher_questions(
    status_filter: Optional[str] = None,
    subject_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    query = db.query(AskTeacherQuestion).filter(
        AskTeacherQuestion.teacher_id == current_teacher.id
    )
    if status_filter and status_filter.upper() != "ALL":
        if status_filter.upper() == "OPEN" or status_filter.upper() == "PENDING":
            query = query.filter(AskTeacherQuestion.status == QuestionStatus.PENDING)
        elif status_filter.upper() == "ANSWERED":
            query = query.filter(AskTeacherQuestion.status == QuestionStatus.ANSWERED)
    if subject_id:
        query = query.filter(AskTeacherQuestion.subject_id == subject_id)

    questions = query.order_by(AskTeacherQuestion.created_at.desc()).all()
    return [format_question_out(q) for q in questions]

@router.put("/questions/{id}/answer", response_model=QuestionOut)
@router.post("/{id}/answer", response_model=QuestionOut)
def answer_question(
    id: str,
    answer_in: QuestionAnswer,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    question = db.query(AskTeacherQuestion).filter(
        AskTeacherQuestion.id == id,
        AskTeacherQuestion.teacher_id == current_teacher.id
    ).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found or not assigned to you")

    question.answer = answer_in.answer
    question.status = answer_in.status or QuestionStatus.ANSWERED
    question.answered_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(question)
    return format_question_out(question)

@router.put("/questions/{id}/status", response_model=QuestionOut)
def update_question_status(
    id: str,
    new_status: QuestionStatus,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    question = db.query(AskTeacherQuestion).filter(
        AskTeacherQuestion.id == id,
        AskTeacherQuestion.teacher_id == current_teacher.id
    ).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    question.status = new_status
    db.commit()
    db.refresh(question)
    return format_question_out(question)
