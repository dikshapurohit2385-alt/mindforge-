import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime, Enum, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database.base import Base

def generate_uuid():
    return str(uuid.uuid4())

class DocumentStatus(str, enum.Enum):
    UPLOADED = "UPLOADED"
    PROCESSING = "PROCESSING"
    EXTRACTED = "EXTRACTED"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    FAILED = "FAILED"

class ExtractionMethod(str, enum.Enum):
    DIRECT_TEXT = "DIRECT_TEXT"
    OCR = "OCR"
    HYBRID = "HYBRID"
    SCANNED_NEEDS_OCR = "SCANNED_NEEDS_OCR"

class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    storage_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(100), default="application/pdf", nullable=False)
    page_count = Column(Integer, default=0, nullable=False)
    status = Column(Enum(DocumentStatus), default=DocumentStatus.UPLOADED, nullable=False, index=True)
    error_message = Column(Text, nullable=True)

    # Curriculum Hierarchy Links
    subject_id = Column(String, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    chapter_id = Column(String, ForeignKey("chapters.id", ondelete="SET NULL"), nullable=True, index=True)
    module_id = Column(String, ForeignKey("modules.id", ondelete="SET NULL"), nullable=True, index=True)

    # Teacher Ownership & Review
    uploaded_by = Column(String, ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False, index=True)
    reviewed_by = Column(String, ForeignKey("teachers.id", ondelete="SET NULL"), nullable=True)
    review_comment = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    subject = relationship("Subject")
    chapter = relationship("Chapter")
    module = relationship("Module")
    uploader = relationship("Teacher", foreign_keys=[uploaded_by])
    reviewer = relationship("Teacher", foreign_keys=[reviewed_by])
    contents = relationship(
        "ExtractedContent",
        back_populates="document",
        cascade="all, delete-orphan",
        order_by="ExtractedContent.page_number"
    )

class ExtractedContent(Base):
    __tablename__ = "extracted_contents"

    id = Column(String, primary_key=True, default=generate_uuid)
    document_id = Column(String, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    page_number = Column(Integer, nullable=False)
    content_text = Column(Text, nullable=False)
    structured_data = Column(JSON, nullable=True)  # headings, sections, paragraphs, topics
    extraction_method = Column(Enum(ExtractionMethod), default=ExtractionMethod.DIRECT_TEXT, nullable=False)
    is_edited = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    document = relationship("Document", back_populates="contents")
