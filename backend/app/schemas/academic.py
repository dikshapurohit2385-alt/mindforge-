from pydantic import BaseModel, ConfigDict
from datetime import datetime, date
from typing import Optional, List
from app.models.academic import QuestionStatus, AttendanceStatus

# School Class Schemas
class SchoolClassCreate(BaseModel):
    name: str # e.g. "Class 9"
    grade_level: Optional[int] = 9

class SchoolClassOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    grade_level: int
    created_at: datetime
    subject_count: Optional[int] = 0

# Subject Schemas
class SubjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    class_id: Optional[str] = None
    class_name: Optional[str] = None

class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    class_id: Optional[str] = None
    class_name: Optional[str] = None

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
    class_id: Optional[str] = None
    class_name: Optional[str] = None
    chapter_count: Optional[int] = 0
    chapters: List[ChapterOut] = []
    created_at: datetime

# Attendance Schemas
class AttendanceMarkItem(BaseModel):
    student_id: str
    status: AttendanceStatus # PRESENT or ABSENT

class AttendanceMarkIn(BaseModel):
    class_id: str
    subject_id: str
    date: date
    records: List[AttendanceMarkItem]

class SubjectAttendanceSummary(BaseModel):
    subject_id: str
    subject_name: str
    class_name: Optional[str] = None
    total_classes: int
    attended_classes: int
    missed_classes: int
    attendance_percentage: float
    status_label: str # "On track", "Monitor", "Catch-up recommended"
    needs_catchup: bool
    catchup_tier: Optional[str] = None # "ACCELERATED" vs "FOUNDATIONAL"

class StudentAttendanceRosterItem(BaseModel):
    student_id: str
    student_name: str
    total_classes: int
    attended_classes: int
    missed_classes: int
    attendance_percentage: float
    status_label: str
    quiz_accuracy: float
    needs_catchup: bool

# AI Catch-Up Path Schemas
class CatchUpSection(BaseModel):
    title: str
    section_type: str # "missed_concepts", "key_definitions", "visual_diagram", "short_explanation", "key_examples", "quick_check"
    content: str
    bullet_points: List[str] = []
    diagram_headers: Optional[List[str]] = None
    diagram_rows: Optional[List[List[str]]] = None

class CatchUpPathOut(BaseModel):
    subject_id: str
    subject_name: str
    attendance_percentage: float
    quiz_accuracy: float
    catchup_tier: str # "ACCELERATED" or "FOUNDATIONAL"
    recommendation_summary: str
    missed_chapters: List[str] = []
    sections: List[CatchUpSection] = []

# Interactive Study Workspace (Text Selection, Highlights, Comments)
class TextHighlightCreate(BaseModel):
    subject_id: str
    chapter_id: Optional[str] = None
    module_id: Optional[str] = None
    selected_text: str
    color: Optional[str] = "yellow"

class TextHighlightOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    student_id: str
    subject_id: str
    chapter_id: Optional[str] = None
    module_id: Optional[str] = None
    selected_text: str
    color: str
    created_at: datetime

class TextCommentCreate(BaseModel):
    subject_id: str
    chapter_id: Optional[str] = None
    module_id: Optional[str] = None
    selected_text: str
    comment_text: str

class TextCommentUpdate(BaseModel):
    comment_text: str

class TextCommentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    student_id: str
    subject_id: str
    chapter_id: Optional[str] = None
    module_id: Optional[str] = None
    selected_text: str
    comment_text: str
    created_at: datetime
    updated_at: datetime

class ContextualAIAskIn(BaseModel):
    subject_id: str
    chapter_id: Optional[str] = None
    module_id: Optional[str] = None
    selected_text: str
    mode: Optional[str] = "explain" # "explain", "example", "steps", "importance", "custom"
    custom_prompt: Optional[str] = None

class ContextualAIAskOut(BaseModel):
    selected_text: str
    mode: str
    explanation: str
    key_points: List[str] = []
    real_world_analogy: Optional[str] = None

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
