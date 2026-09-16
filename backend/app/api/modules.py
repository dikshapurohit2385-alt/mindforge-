from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.deps import get_db, get_current_user, get_current_teacher
from app.models.user import User, Teacher
from app.models.academic import Chapter, Module
from app.schemas.academic import ModuleCreate, ModuleUpdate, ModuleOut

router = APIRouter(tags=["modules"])

@router.post("/chapters/{chapter_id}/modules", response_model=ModuleOut, status_code=status.HTTP_201_CREATED)
def create_module(
    chapter_id: str,
    module_in: ModuleCreate,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    if chapter.subject.teacher_id != current_teacher.id:
        raise HTTPException(status_code=403, detail="Not authorized to manage this chapter")

    module = Module(
        chapter_id=chapter_id,
        title=module_in.title,
        description=module_in.description,
        order_index=module_in.order_index or 0
    )
    db.add(module)
    db.commit()
    db.refresh(module)
    return module

@router.get("/chapters/{chapter_id}/modules", response_model=List[ModuleOut])
def list_modules(
    chapter_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    modules = db.query(Module).filter(Module.chapter_id == chapter_id).order_by(Module.order_index).all()
    return modules

@router.put("/modules/{id}", response_model=ModuleOut)
def update_module(
    id: str,
    module_in: ModuleUpdate,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    module = db.query(Module).filter(Module.id == id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    if module.chapter.subject.teacher_id != current_teacher.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this module")

    if module_in.title is not None:
        module.title = module_in.title
    if module_in.description is not None:
        module.description = module_in.description
    if module_in.order_index is not None:
        module.order_index = module_in.order_index

    db.commit()
    db.refresh(module)
    return module

@router.delete("/modules/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_module(
    id: str,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    module = db.query(Module).filter(Module.id == id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    if module.chapter.subject.teacher_id != current_teacher.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this module")

    db.delete(module)
    db.commit()
    return None
