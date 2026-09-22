import traceback
from sqlalchemy.orm import Session
from app.database.session import SessionLocal
from app.models.document import Document, ExtractedContent, DocumentStatus, ExtractionMethod
from app.services.storage_service import storage_service
from app.services.pdf_extractor import pdf_extractor
from app.services.ocr_service import ocr_service
from app.services.content_structurer import content_structurer

from typing import Optional

def process_document_pipeline(document_id: str, relative_storage_path: Optional[str] = None, db: Optional[Session] = None):
    """
    Background worker task to extract, OCR, and structure PDF content.
    Guarantees full lifecycle status updates and error isolation.
    """
    own_db = False
    if db is None:
        db = SessionLocal()
        own_db = True

    try:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            print(f"Error: Document {document_id} not found in database.")
            return

        doc.status = DocumentStatus.PROCESSING
        db.commit()

        path_to_use = relative_storage_path or doc.storage_path
        abs_path = str(storage_service.get_absolute_path(path_to_use))
        
        # 1. Native PyMuPDF Text Extraction
        extraction = pdf_extractor.extract_document(abs_path)
        page_count = extraction["page_count"]
        doc.page_count = page_count

        has_scanned_notice = False

        for page_data in extraction["pages"]:
            page_num = page_data["page_number"]
            raw_text = page_data["text"]
            extraction_method = ExtractionMethod.DIRECT_TEXT

            # 2. Check for scanned / image-only pages requiring OCR
            if page_data["is_scanned_candidate"]:
                ocr_text = ocr_service.extract_text_from_pdf_page(abs_path, page_num)
                if ocr_text:
                    raw_text = ocr_text
                    extraction_method = ExtractionMethod.OCR
                else:
                    if not raw_text:
                        raw_text = f"[Scanned page detected on page {page_num}. Image-only content with OCR unavailable.]"
                        extraction_method = ExtractionMethod.SCANNED_NEEDS_OCR
                        has_scanned_notice = True

            # 3. Structure extracted content into educational blocks
            structured_data = content_structurer.structure_page(raw_text, page_num)

            # 4. Save Extracted Content
            extracted_record = ExtractedContent(
                document_id=doc.id,
                page_number=page_num,
                content_text=raw_text,
                structured_data=structured_data,
                extraction_method=extraction_method,
                is_edited=False
            )
            db.add(extracted_record)

        # 5. Transition status to REVIEW_REQUIRED for teacher inspection
        doc.status = DocumentStatus.REVIEW_REQUIRED
        if has_scanned_notice:
            doc.error_message = "Contains scanned or image-heavy pages. Please verify extracted text."
        else:
            doc.error_message = None

        db.commit()
        db.refresh(doc)
        print(f"Successfully processed document {document_id} ({page_count} pages).")

    except Exception as e:
        traceback.print_exc()
        db.rollback()
        try:
            doc = db.query(Document).filter(Document.id == document_id).first()
            if doc:
                doc.status = DocumentStatus.FAILED
                doc.error_message = f"Processing failed: {str(e)[:400]}"
                db.commit()
        except Exception:
            pass
    finally:
        if own_db and db:
            db.close()
