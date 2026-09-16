import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Integer, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base

def generate_uuid():
    return str(uuid.uuid4())

class QuestionStatus(str, enum.Enum):
    PENDING = "PENDING"
    ANSWERED = "ANSWERED"
    RESOLVED = "RESOLVED"

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    teacher_id = Column(String, ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    teacher = relationship("Teacher", back_populates="subjects")
    chapters = relationship("Chapter", back_populates="subject", cascade="all, delete-orphan", order_by="Chapter.order_index")
    notes = relationship("StudentNote", back_populates="subject", cascade="all, delete-orphan")
    questions = relationship("AskTeacherQuestion", back_populates="subject", cascade="all, delete-orphan")

class Chapter(Base):
    __tablename__ = "chapters"

    id = Column(String, primary_key=True, default=generate_uuid)
    subject_id = Column(String, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    subject = relationship("Subject", back_populates="chapters")
    modules = relationship("Module", back_populates="chapter", cascade="all, delete-orphan", order_by="Module.order_index")
    notes = relationship("StudentNote", back_populates="chapter")
    questions = relationship("AskTeacherQuestion", back_populates="chapter")

class Module(Base):
    __tablename__ = "modules"

    id = Column(String, primary_key=True, default=generate_uuid)
    chapter_id = Column(String, ForeignKey("chapters.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    chapter = relationship("Chapter", back_populates="modules")
    notes = relationship("StudentNote", back_populates="module")
    questions = relationship("AskTeacherQuestion", back_populates="module")

class StudentNote(Base):
    __tablename__ = "student_notes"

    id = Column(String, primary_key=True, default=generate_uuid)
    student_id = Column(String, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(String, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    chapter_id = Column(String, ForeignKey("chapters.id", ondelete="SET NULL"), nullable=True)
    module_id = Column(String, ForeignKey("modules.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    student = relationship("Student", back_populates="notes")
    subject = relationship("Subject", back_populates="notes")
    chapter = relationship("Chapter", back_populates="notes")
    module = relationship("Module", back_populates="notes")

class AskTeacherQuestion(Base):
    __tablename__ = "ask_teacher_questions"

    id = Column(String, primary_key=True, default=generate_uuid)
    student_id = Column(String, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    teacher_id = Column(String, ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(String, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    chapter_id = Column(String, ForeignKey("chapters.id", ondelete="SET NULL"), nullable=True)
    module_id = Column(String, ForeignKey("modules.id", ondelete="SET NULL"), nullable=True)
    selected_text = Column(Text, nullable=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=True)
    status = Column(Enum(QuestionStatus), default=QuestionStatus.PENDING, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    answered_at = Column(DateTime, nullable=True)

    student = relationship("Student", back_populates="questions")
    teacher = relationship("Teacher", back_populates="questions_assigned")
    subject = relationship("Subject", back_populates="questions")
    chapter = relationship("Chapter", back_populates="questions")
    module = relationship("Module", back_populates="questions")
