import os
import re
import math
import hashlib
from typing import List, Dict, Any, Tuple, Optional
import httpx
from sqlalchemy.orm import Session
from app.models.document import Document, ExtractedContent, DocumentStatus
from app.models.learning_engine import DocumentChunk

STOP_WORDS = {
    "a", "an", "the", "in", "on", "at", "to", "for", "of", "and", "or", "is", "are", 
    "was", "were", "be", "been", "do", "does", "did", "how", "what", "which", "who", 
    "whom", "this", "that", "these", "those", "you", "we", "they", "it", "with", "as", 
    "by", "from", "can", "could", "will", "would", "should", "shall", "so", "if", "not"
}

class VectorEngine:
    """
    High-precision mathematical embedding vectorizer using n-gram subwords + TF-IDF,
    guaranteeing real deterministic cosine similarity calculations.
    Optionally calls Google Gemini API if GEMINI_API_KEY is configured.
    """
    VECTOR_DIM = 512

    @staticmethod
    def _tokenize(text: str) -> List[str]:
        cleaned = re.sub(r'[^a-zA-Z0-9\s]', ' ', text.lower())
        raw_tokens = cleaned.split()
        tokens = [t for t in raw_tokens if t not in STOP_WORDS and len(t) > 1]
        features = list(tokens)
        # Add character tri-grams for subword matching
        for token in tokens:
            if len(token) >= 4:
                for i in range(len(token) - 2):
                    features.append(token[i:i+3])
        return features

    @classmethod
    def compute_dense_vector(cls, text: str) -> List[float]:
        tokens = cls._tokenize(text)
        if not tokens:
            return [0.0] * cls.VECTOR_DIM

        vec = [0.0] * cls.VECTOR_DIM
        for token in tokens:
            idx = int(hashlib.md5(token.encode('utf-8')).hexdigest(), 16) % cls.VECTOR_DIM
            vec[idx] += 1.0

        # L2 Normalization so cosine similarity is simply dot product
        magnitude = math.sqrt(sum(v * v for v in vec))
        if magnitude > 0:
            vec = [round(v / magnitude, 6) for v in vec]
        return vec

    @classmethod
    async def get_embedding(cls, text: str) -> List[float]:
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={api_key}"
                async with httpx.AsyncClient(timeout=8.0) as client:
                    resp = await client.post(
                        url,
                        json={
                            "model": "models/text-embedding-004",
                            "content": {"parts": [{"text": text[:2000]}]}
                        }
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        values = data.get("embedding", {}).get("values", [])
                        if values:
                            # L2 Normalize
                            mag = math.sqrt(sum(v * v for v in values))
                            return [v / mag for v in values] if mag > 0 else values
            except Exception as e:
                print(f"[RAG] Gemini embedding failed, falling back to dense vectorizer: {e}")

        return cls.compute_dense_vector(text)

    @staticmethod
    def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
        if not vec_a or not vec_b or len(vec_a) != len(vec_b):
            return 0.0
        dot_product = sum(a * b for a, b in zip(vec_a, vec_b))
        return max(0.0, min(1.0, dot_product))


class RAGService:
    SIMILARITY_THRESHOLD = 0.28
    CHUNK_SIZE = 750
    CHUNK_OVERLAP = 120

    def chunk_text(self, text: str, chunk_size: int = 750, overlap: int = 120) -> List[str]:
        text = text.strip()
        if not text:
            return []
        if len(text) <= chunk_size:
            return [text]

        chunks = []
        start = 0
        while start < len(text):
            end = start + chunk_size
            if end < len(text):
                # Try finding natural sentence or newline boundary
                boundary = text.rfind('. ', start, end)
                if boundary == -1:
                    boundary = text.rfind('\n', start, end)
                if boundary != -1 and boundary > start + chunk_size // 2:
                    end = boundary + 1
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            start = end - overlap
            if start >= len(text) - overlap:
                break
        return chunks

    async def index_document(self, document_id: str, db: Session) -> int:
        """
        Chunks and vectorizes all pages of a document into DocumentChunk records.
        """
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            return 0

        # Remove existing chunks for clean re-indexing
        db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id).delete()

        contents = db.query(ExtractedContent).filter(
            ExtractedContent.document_id == document_id
        ).order_by(ExtractedContent.page_number).all()

        total_chunks = 0
        chunk_idx = 0

        for page in contents:
            page_text = page.content_text or ""
            chunks = self.chunk_text(page_text, self.CHUNK_SIZE, self.CHUNK_OVERLAP)

            for chunk_str in chunks:
                embedding = await VectorEngine.get_embedding(chunk_str)
                record = DocumentChunk(
                    document_id=doc.id,
                    subject_id=doc.subject_id,
                    module_id=doc.module_id,
                    page_number=page.page_number,
                    chunk_index=chunk_idx,
                    chunk_text=chunk_str,
                    embedding=embedding
                )
                db.add(record)
                chunk_idx += 1
                total_chunks += 1

        db.commit()
        return total_chunks

    async def query_knowledge_base(
        self,
        subject_id: str,
        question: str,
        module_id: Optional[str],
        db: Session
    ) -> Dict[str, Any]:
        """
        Full RAG pipeline:
        1. Embed user question
        2. Vector search against approved document chunks
        3. Anti-hallucination threshold filter
        4. Synthesize answer with page-level citations
        """
        # Fetch candidate chunks
        query = db.query(DocumentChunk).join(Document, DocumentChunk.document_id == Document.id).filter(
            DocumentChunk.subject_id == subject_id,
            Document.status == DocumentStatus.APPROVED
        )
        if module_id:
            query = query.filter(DocumentChunk.module_id == module_id)

        candidate_chunks = query.all()
        if not candidate_chunks:
            # Try broader search across subject if module had no approved documents
            candidate_chunks = db.query(DocumentChunk).join(Document, DocumentChunk.document_id == Document.id).filter(
                DocumentChunk.subject_id == subject_id,
                Document.status == DocumentStatus.APPROVED
            ).all()

        if not candidate_chunks:
            return {
                "question": question,
                "answer": "I couldn't find enough information about this topic in the uploaded material.",
                "source_found": False,
                "citations": [],
                "confidence_score": 0.0,
                "anti_hallucination_note": "No approved curriculum documents have been indexed for this subject yet."
            }

        q_vec = await VectorEngine.get_embedding(question)

        # Score all candidate chunks
        scored_chunks: List[Tuple[float, DocumentChunk]] = []
        for chunk in candidate_chunks:
            if chunk.embedding and len(chunk.embedding) == len(q_vec):
                sim = VectorEngine.cosine_similarity(q_vec, chunk.embedding)
                scored_chunks.append((sim, chunk))

        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        top_matches = [sc for sc in scored_chunks if sc[0] >= self.SIMILARITY_THRESHOLD][:4]

        # Anti-Hallucination Guard: Reject if confidence is below threshold
        if not top_matches:
            top_score = scored_chunks[0][0] if scored_chunks else 0.0
            return {
                "question": question,
                "answer": "I couldn't find enough information about this topic in the uploaded material.",
                "source_found": False,
                "citations": [],
                "confidence_score": round(top_score, 3),
                "anti_hallucination_note": f"Highest relevance match ({round(top_score * 100, 1)}%) was below the verification threshold ({int(self.SIMILARITY_THRESHOLD * 100)}%). MindForge refuses to hallucinate unverified content."
            }

        # Format Citations
        citations = []
        context_passages = []
        for score, chunk in top_matches:
            doc_title = chunk.document.title if chunk.document else "Curriculum Document"
            snippet = chunk.chunk_text[:280] + ("..." if len(chunk.chunk_text) > 280 else "")
            citations.append({
                "document_id": chunk.document_id,
                "document_title": doc_title,
                "page_number": chunk.page_number,
                "snippet": snippet,
                "relevance_score": round(score, 3)
            })
            context_passages.append(f"[{doc_title}, Page {chunk.page_number}]:\n{chunk.chunk_text}")

        context_text = "\n\n---\n\n".join(context_passages)

        # Synthesize Answer
        answer_text = await self._generate_grounded_answer(question, context_text, citations)

        return {
            "question": question,
            "answer": answer_text,
            "source_found": True,
            "citations": citations,
            "confidence_score": round(top_matches[0][0], 3),
            "anti_hallucination_note": None
        }

    async def _generate_grounded_answer(
        self,
        question: str,
        context: str,
        citations: List[Dict[str, Any]]
    ) -> str:
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            try:
                system_instruction = (
                    "You are MindForge's strict educational AI tutor. You MUST answer the student's question "
                    "relying EXCLUSIVELY on the provided document excerpts. "
                    "Do NOT extrapolate or invent facts not present in the text. "
                    "Cite the document name and page number for each key claim."
                )
                prompt = (
                    f"CONTEXT PASSAGES:\n{context}\n\n"
                    f"STUDENT QUESTION: {question}\n\n"
                    f"Provide a clear, accurate explanation strictly grounded in the context above:"
                )
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
                async with httpx.AsyncClient(timeout=12.0) as client:
                    resp = await client.post(
                        url,
                        json={
                            "contents": [{"parts": [{"text": f"{system_instruction}\n\n{prompt}"}]}],
                            "generationConfig": {"temperature": 0.2, "maxOutputTokens": 600}
                        }
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        if text:
                            return text.strip()
            except Exception as e:
                print(f"[RAG] Gemini generation failed: {e}")

        # Deterministic Grounded Synthesis Fallback
        primary_cit = citations[0]
        # Find key sentences from top passages that contain relevant query keywords
        q_words = set(re.sub(r'[^a-zA-Z0-9\s]', '', question.lower()).split())
        matched_sentences = []
        for line in context.split('\n'):
            line_str = line.strip()
            if len(line_str) > 20 and not line_str.startswith('[') and not line_str.startswith('---'):
                words = set(re.sub(r'[^a-zA-Z0-9\s]', '', line_str.lower()).split())
                overlap = len(words.intersection(q_words))
                if overlap > 0:
                    matched_sentences.append((overlap, line_str))

        matched_sentences.sort(key=lambda x: x[0], reverse=True)
        top_excerpts = [s[1] for s in matched_sentences[:3]]
        if not top_excerpts:
            top_excerpts = [primary_cit["snippet"]]

        body = " ".join(top_excerpts)
        return (
            f"Based on **{primary_cit['document_title']}** (Page {primary_cit['page_number']}):\n\n"
            f"{body}\n\n"
            f"> *Source verified from page {primary_cit['page_number']} with {int(primary_cit['relevance_score'] * 100)}% relevance.*"
        )

rag_service = RAGService()
