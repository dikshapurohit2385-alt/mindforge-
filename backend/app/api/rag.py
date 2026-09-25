from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.deps import get_db, get_current_user
from app.models.user import User, UserRole
from app.models.document import Document, DocumentStatus
from app.schemas.learning_engine import (
    RAGQueryIn,
    RAGQueryOut,
    RAGCitation
)
from app.services.rag_service import rag_service

router = APIRouter(prefix="/rag", tags=["rag"])

@router.post("/query", response_model=RAGQueryOut)
async def query_curriculum_rag(
    payload: RAGQueryIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        res = await rag_service.query_knowledge_base(
            subject_id=payload.subject_id,
            question=payload.question,
            module_id=payload.module_id,
            db=db
        )
        return RAGQueryOut(
            question=res["question"],
            answer=res["answer"],
            source_found=res["source_found"],
            citations=[
                RAGCitation(
                    document_id=c["document_id"],
                    document_title=c["document_title"],
                    page_number=c["page_number"],
                    snippet=c["snippet"],
                    relevance_score=c["relevance_score"]
                )
                for c in res["citations"]
            ],
            confidence_score=res["confidence_score"],
            anti_hallucination_note=res["anti_hallucination_note"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG query failed: {str(e)}")

@router.post("/index-approved")
async def index_all_approved_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    approved_docs = db.query(Document).filter(
        Document.status == DocumentStatus.APPROVED
    ).all()

    total_chunks = 0
    indexed_docs = 0

    for doc in approved_docs:
        try:
            chunks = await rag_service.index_document(doc.id, db)
            total_chunks += chunks
            indexed_docs += 1
        except Exception as e:
            print(f"[RAG] Error indexing doc {doc.id}: {e}")

    return {
        "status": "success",
        "documents_indexed": indexed_docs,
        "total_chunks_created": total_chunks
    }
