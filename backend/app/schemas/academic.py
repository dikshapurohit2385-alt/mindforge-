from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List
from app.models.academic import QuestionStatus

# Subject Schemas
class SubjectCreate(BaseModel):
    name: str
    description: Optional[str] = None

class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class ModuleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    chapter_id: str
    title: str
    description: Optional[str] = None
    order_index: int
    created_at: datetime

class ModuleCreate(BaseModel):
    title: str
    description: Optional[str] = None
    order_index: Optional[int] = 0

class ModuleUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    order_index: Optional[int] = None

class ChapterOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    subject_id: str
    title: str
    description: Optional[str] = None
    order_index: int
    created_at: datetime
    modules: List[ModuleOut] = []

class ChapterCreate(BaseModel):
    title: str
    description: Optional[str] = None
    order_index: Optional[int] = 0

class ChapterUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    order_index: Optional[int] = None

class TeacherBasicOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str

class SubjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: Optional[str] = None
    teacher_id: str
    teacher_name: Optional[str] = None
    chapter_count: Optional[int] = 0
    chapters: List[ChapterOut] = []
    created_at: datetime

# Student Note Schemas
class NoteCreate(BaseModel):
    subject_id: str
    chapter_id: Optional[str] = None
    module_id: Optional[str] = None
    title: str
    content: str

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    subject_id: Optional[str] = None
    chapter_id: Optional[str] = None
    module_id: Optional[str] = None

class NoteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    student_id: str
    subject_id: str
    chapter_id: Optional[str] = None
    module_id: Optional[str] = None
    subject_name: Optional[str] = None
    chapter_title: Optional[str] = None
    module_title: Optional[str] = None
    title: str
    content: str
    created_at: datetime
    updated_at: datetime

# Ask Teacher Schemas
class QuestionCreate(BaseModel):
    subject_id: str
    chapter_id: Optional[str] = None
    module_id: Optional[str] = None
    selected_text: Optional[str] = None
    question: str

class QuestionAnswer(BaseModel):
    answer: str
    status: Optional[QuestionStatus] = QuestionStatus.ANSWERED

class QuestionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    student_id: str
    student_name: Optional[str] = None
    teacher_id: str
    teacher_name: Optional[str] = None
    subject_id: str
    subject_name: Optional[str] = None
    chapter_id: Optional[str] = None
    chapter_title: Optional[str] = None
    module_id: Optional[str] = None
    module_title: Optional[str] = None
    selected_text: Optional[str] = None
    question: str
    answer: Optional[str] = None
    status: QuestionStatus
    created_at: datetime
    answered_at: Optional[datetime] = None
