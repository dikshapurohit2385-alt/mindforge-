from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_user, get_current_teacher
from app.models.user import User, UserRole, Teacher, Student
from app.models.academic import Subject, Chapter, Module
from app.models.document import Document, ExtractedContent, DocumentStatus
from app.schemas.document import (
    DocumentOut,
    DocumentDetailOut,
    ExtractedContentOut,
    ExtractedContentUpdate,
    DocumentReviewIn,
)
from app.services.storage_service import storage_service
from app.services.document_service import process_document_pipeline

router = APIRouter(prefix="/documents", tags=["documents"])


def format_document_out(doc: Document) -> DocumentOut:
    subject_name = doc.subject.name if doc.subject else None
    chapter_title = doc.chapter.title if doc.chapter else None
    module_title = doc.module.title if doc.module else None
    uploader_name = doc.uploader.user.name if doc.uploader and doc.uploader.user else None
    reviewer_name = doc.reviewer.user.name if doc.reviewer and doc.reviewer.user else None

    return DocumentOut(
        id=doc.id,
        title=doc.title,
        original_filename=doc.original_filename,
        file_size=doc.file_size,
        mime_type=doc.mime_type,
        page_count=doc.page_count,
        status=doc.status,
        error_message=doc.error_message,
        subject_id=doc.subject_id,
        chapter_id=doc.chapter_id,
        module_id=doc.module_id,
        subject_name=subject_name,
        chapter_title=chapter_title,
        module_title=module_title,
        uploaded_by=doc.uploaded_by,
        uploader_name=uploader_name,
        reviewed_by=doc.reviewed_by,
        reviewer_name=reviewer_name,
        review_comment=doc.review_comment,
        reviewed_at=doc.reviewed_at,
        created_at=doc.created_at,
        updated_at=doc.updated_at,
    )


@router.post("/upload", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: str = Form(...),
    subject_id: str = Form(...),
    chapter_id: Optional[str] = Form(None),
    module_id: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher),
):
    # 1. Validate Subject Ownership
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    if subject.teacher_id != current_teacher.id:
        raise HTTPException(status_code=403, detail="Not authorized to upload materials for this subject")

    # 2. Validate Chapter hierarchy if provided
    if chapter_id and chapter_id.strip():
        chapter = db.query(Chapter).filter(Chapter.id == chapter_id, Chapter.subject_id == subject_id).first()
        if not chapter:
            raise HTTPException(status_code=404, detail="Chapter not found or does not belong to this subject")
    else:
        chapter_id = None

    # 3. Validate Module hierarchy if provided
    if module_id and module_id.strip():
        if not chapter_id:
            raise HTTPException(status_code=400, detail="Cannot assign module without specifying chapter")
        module = db.query(Module).filter(Module.id == module_id, Module.chapter_id == chapter_id).first()
        if not module:
            raise HTTPException(status_code=404, detail="Module not found or does not belong to this chapter")
    else:
        module_id = None

    # 4. Save and validate PDF file securely
    try:
        relative_path, file_size = await storage_service.save_uploaded_pdf(file)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process and save document file: {str(e)}")

    # 6. Create Document record in DB
    document = Document(
        title=title.strip(),
        original_filename=file.filename or "document.pdf",
        storage_path=relative_path,
        file_size=file_size,
        mime_type="application/pdf",
        page_count=0,
        status=DocumentStatus.UPLOADED,
        subject_id=subject_id,
        chapter_id=chapter_id,
        module_id=module_id,
        uploaded_by=current_teacher.id,
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    # 7. Queue background ingestion pipeline
    background_tasks.add_task(process_document_pipeline, document.id, relative_path)

    return format_document_out(document)


@router.get("", response_model=List[DocumentOut])
def list_documents(
    subject_id: Optional[str] = Query(None),
    chapter_id: Optional[str] = Query(None),
    module_id: Optional[str] = Query(None),
    status_filter: Optional[DocumentStatus] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Document)

    # Role-based scoping
    if current_user.role == UserRole.TEACHER:
        teacher = db.query(Teacher).filter(Teacher.user_id == current_user.id).first()
        if not teacher:
            raise HTTPException(status_code=404, detail="Teacher profile not found")
        query = query.filter(Document.uploaded_by == teacher.id)
    elif current_user.role == UserRole.STUDENT:
        # Students CAN ONLY see APPROVED documents
        query = query.filter(Document.status == DocumentStatus.APPROVED)
    else:
        raise HTTPException(status_code=403, detail="Unauthorized role")

    # Filters
    if subject_id:
        query = query.filter(Document.subject_id == subject_id)
    if chapter_id:
        query = query.filter(Document.chapter_id == chapter_id)
    if module_id:
        query = query.filter(Document.module_id == module_id)
    if status_filter and current_user.role == UserRole.TEACHER:
        query = query.filter(Document.status == status_filter)

    documents = query.order_by(Document.created_at.desc()).all()
    return [format_document_out(doc) for doc in documents]


@router.get("/{id}", response_model=DocumentDetailOut)
def get_document_detail(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Permissions
    if current_user.role == UserRole.STUDENT:
        if doc.status != DocumentStatus.APPROVED:
            raise HTTPException(status_code=403, detail="Document is not approved for student viewing")
    elif current_user.role == UserRole.TEACHER:
        teacher = db.query(Teacher).filter(Teacher.user_id == current_user.id).first()
        if not teacher or doc.uploaded_by != teacher.id:
            raise HTTPException(status_code=403, detail="Not authorized to access this document")

    formatted = format_document_out(doc)
    contents = (
        db.query(ExtractedContent)
        .filter(ExtractedContent.document_id == id)
        .order_by(ExtractedContent.page_number.asc())
        .all()
    )

    return DocumentDetailOut(
        **formatted.model_dump(),
        contents=[ExtractedContentOut.model_validate(c) for c in contents],
    )


@router.get("/{id}/content", response_model=List[ExtractedContentOut])
def get_document_content(
    id: str,
    page: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if current_user.role == UserRole.STUDENT:
        if doc.status != DocumentStatus.APPROVED:
            raise HTTPException(status_code=403, detail="Document is not approved for student viewing")
    elif current_user.role == UserRole.TEACHER:
        teacher = db.query(Teacher).filter(Teacher.user_id == current_user.id).first()
        if not teacher or doc.uploaded_by != teacher.id:
            raise HTTPException(status_code=403, detail="Not authorized to access this document")

    query = db.query(ExtractedContent).filter(ExtractedContent.document_id == id)
    if page is not None:
        query = query.filter(ExtractedContent.page_number == page)

    contents = query.order_by(ExtractedContent.page_number.asc()).all()
    return [ExtractedContentOut.model_validate(c) for c in contents]


@router.put("/{id}/content/{content_id}", response_model=ExtractedContentOut)
def update_extracted_content(
    id: str,
    content_id: str,
    content_in: ExtractedContentUpdate,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher),
):
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.uploaded_by != current_teacher.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this document")

    content = (
        db.query(ExtractedContent)
        .filter(ExtractedContent.id == content_id, ExtractedContent.document_id == id)
        .first()
    )
    if not content:
        raise HTTPException(status_code=404, detail="Extracted content block not found")

    content.content_text = content_in.content_text
    if content_in.structured_data is not None:
        content.structured_data = content_in.structured_data
    content.is_edited = True
    content.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(content)
    return ExtractedContentOut.model_validate(content)


@router.post("/{id}/review", response_model=DocumentOut)
def review_document(
    id: str,
    review_in: DocumentReviewIn,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher),
):
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.uploaded_by != current_teacher.id:
        raise HTTPException(status_code=403, detail="Not authorized to review this document")

    if doc.status == DocumentStatus.PROCESSING:
        raise HTTPException(status_code=400, detail="Document is currently being processed. Please wait.")

    if review_in.status not in (DocumentStatus.APPROVED, DocumentStatus.REJECTED):
        raise HTTPException(status_code=400, detail="Review status must be either APPROVED or REJECTED")

    doc.status = review_in.status
    doc.review_comment = review_in.comment
    doc.reviewed_by = current_teacher.id
    doc.reviewed_at = datetime.now(timezone.utc)
    doc.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(doc)
    return format_document_out(doc)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    id: str,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher),
):
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.uploaded_by != current_teacher.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this document")

    # Delete physical file from storage
    storage_service.delete_file(doc.storage_path)

    # Cascades will delete associated extracted_contents
    db.delete(doc)
    db.commit()
    return None


@router.get("/{id}/download")
def download_document_file(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Permissions
    if current_user.role == UserRole.STUDENT:
        if doc.status != DocumentStatus.APPROVED:
            raise HTTPException(status_code=403, detail="Document is not approved for student download")
    elif current_user.role == UserRole.TEACHER:
        teacher = db.query(Teacher).filter(Teacher.user_id == current_user.id).first()
        if not teacher or doc.uploaded_by != teacher.id:
            raise HTTPException(status_code=403, detail="Not authorized to download this document")

    abs_path = storage_service.get_absolute_path(doc.storage_path)
    if not storage_service.file_exists(doc.storage_path):
        raise HTTPException(status_code=404, detail="Document file does not exist on disk")

    return FileResponse(
        path=str(abs_path),
        filename=doc.original_filename,
        media_type="application/pdf",
    )
