from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.deps import get_db, get_current_user, get_current_teacher
from app.models.user import User, Teacher
from app.models.academic import Subject, Chapter
from app.schemas.academic import ChapterCreate, ChapterUpdate, ChapterOut

router = APIRouter(tags=["chapters"])

@router.post("/subjects/{subject_id}/chapters", response_model=ChapterOut, status_code=status.HTTP_201_CREATED)
def create_chapter(
    subject_id: str,
    chapter_in: ChapterCreate,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    if subject.teacher_id != current_teacher.id:
        raise HTTPException(status_code=403, detail="Not authorized to manage this subject")

    chapter = Chapter(
        subject_id=subject_id,
        title=chapter_in.title,
        description=chapter_in.description,
        order_index=chapter_in.order_index or 0
    )
    db.add(chapter)
    db.commit()
    db.refresh(chapter)
    return chapter

@router.get("/subjects/{subject_id}/chapters", response_model=List[ChapterOut])
def list_chapters(
    subject_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    chapters = db.query(Chapter).filter(Chapter.subject_id == subject_id).order_by(Chapter.order_index).all()
    return chapters

@router.put("/chapters/{id}", response_model=ChapterOut)
def update_chapter(
    id: str,
    chapter_in: ChapterUpdate,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    chapter = db.query(Chapter).filter(Chapter.id == id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    if chapter.subject.teacher_id != current_teacher.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this chapter")

    if chapter_in.title is not None:
        chapter.title = chapter_in.title
    if chapter_in.description is not None:
        chapter.description = chapter_in.description
    if chapter_in.order_index is not None:
        chapter.order_index = chapter_in.order_index

    db.commit()
    db.refresh(chapter)
    return chapter

@router.delete("/chapters/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_chapter(
    id: str,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    chapter = db.query(Chapter).filter(Chapter.id == id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    if chapter.subject.teacher_id != current_teacher.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this chapter")

    db.delete(chapter)
    db.commit()
    return None
