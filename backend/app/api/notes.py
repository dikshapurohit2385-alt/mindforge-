from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.deps import get_db, get_current_student
from app.models.user import Student
from app.models.academic import StudentNote, Subject, Chapter, Module
from app.schemas.academic import NoteCreate, NoteUpdate, NoteOut

router = APIRouter(prefix="/notes", tags=["notes"])

def format_note_out(note: StudentNote) -> NoteOut:
    subject_name = note.subject.name if note.subject else None
    chapter_title = note.chapter.title if note.chapter else None
    module_title = note.module.title if note.module else None
    return NoteOut(
        id=note.id,
        student_id=note.student_id,
        subject_id=note.subject_id,
        chapter_id=note.chapter_id,
        module_id=note.module_id,
        subject_name=subject_name,
        chapter_title=chapter_title,
        module_title=module_title,
        title=note.title,
        content=note.content,
        created_at=note.created_at,
        updated_at=note.updated_at
    )

@router.post("", response_model=NoteOut, status_code=status.HTTP_201_CREATED)
def create_note(
    note_in: NoteCreate,
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student)
):
    subject = db.query(Subject).filter(Subject.id == note_in.subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    note = StudentNote(
        student_id=current_student.id,
        subject_id=note_in.subject_id,
        chapter_id=note_in.chapter_id,
        module_id=note_in.module_id,
        title=note_in.title,
        content=note_in.content
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return format_note_out(note)

@router.get("", response_model=List[NoteOut])
def list_notes(
    subject_id: Optional[str] = Query(None),
    chapter_id: Optional[str] = Query(None),
    module_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student)
):
    query = db.query(StudentNote).filter(StudentNote.student_id == current_student.id)
    if subject_id:
        query = query.filter(StudentNote.subject_id == subject_id)
    if chapter_id:
        query = query.filter(StudentNote.chapter_id == chapter_id)
    if module_id:
        query = query.filter(StudentNote.module_id == module_id)

    notes = query.order_by(StudentNote.updated_at.desc()).all()
    return [format_note_out(n) for n in notes]

@router.get("/{id}", response_model=NoteOut)
def get_note(
    id: str,
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student)
):
    note = db.query(StudentNote).filter(StudentNote.id == id, StudentNote.student_id == current_student.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return format_note_out(note)

@router.put("/{id}", response_model=NoteOut)
def update_note(
    id: str,
    note_in: NoteUpdate,
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student)
):
    note = db.query(StudentNote).filter(StudentNote.id == id, StudentNote.student_id == current_student.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    if note_in.title is not None:
        note.title = note_in.title
    if note_in.content is not None:
        note.content = note_in.content
    if note_in.subject_id is not None:
        note.subject_id = note_in.subject_id
    if note_in.chapter_id is not None:
        note.chapter_id = note_in.chapter_id
    if note_in.module_id is not None:
        note.module_id = note_in.module_id

    db.commit()
    db.refresh(note)
    return format_note_out(note)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(
    id: str,
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student)
):
    note = db.query(StudentNote).filter(StudentNote.id == id, StudentNote.student_id == current_student.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    db.delete(note)
    db.commit()
    return None
