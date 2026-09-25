from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, ConfigDict
from app.models.document import DocumentStatus, ExtractionMethod

class StructuredSection(BaseModel):
    type: str  # heading, subheading, paragraph, list, table
    level: Optional[int] = None
    text: Optional[str] = None
    items: Optional[List[str]] = None

class StructuredPageData(BaseModel):
    page: int
    title: Optional[str] = None
    headings: List[str] = []
    sections: List[Dict[str, Any]] = []
    learning_topics: List[str] = []
    has_tables: bool = False
    confidence_score: float = 1.0

class ExtractedContentOut(BaseModel):
    id: str
    document_id: str
    page_number: int
    content_text: str
    structured_data: Optional[Dict[str, Any]] = None
    extraction_method: ExtractionMethod
    is_edited: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ExtractedContentUpdate(BaseModel):
    content_text: str
    structured_data: Optional[Dict[str, Any]] = None

class DocumentOut(BaseModel):
    id: str
    title: str
    original_filename: str
    file_size: int
    mime_type: str
    page_count: int
    status: DocumentStatus
    error_message: Optional[str] = None
    subject_id: str
    chapter_id: Optional[str] = None
    module_id: Optional[str] = None
    subject_name: Optional[str] = None
    chapter_title: Optional[str] = None
    module_title: Optional[str] = None
    uploaded_by: str
    uploader_name: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewer_name: Optional[str] = None
    review_comment: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DocumentDetailOut(DocumentOut):
    contents: List[ExtractedContentOut] = []

class DocumentReviewIn(BaseModel):
    status: DocumentStatus  # APPROVED or REJECTED
    comment: Optional[str] = None
