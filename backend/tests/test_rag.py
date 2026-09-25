import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.academic import Subject
from app.models.document import Document, ExtractedContent, DocumentStatus
from app.services.rag_service import rag_service, VectorEngine
from tests.conftest import TestingSessionLocal

client = TestClient(app)

def test_rag_chunking_and_vector_math():
    sample_text = (
        "Supervised machine learning algorithms build a mathematical model of a set of data that contains both the inputs and the desired outputs. "
        "Linear regression is a linear approach to modelling the relationship between a scalar response and one or more explanatory variables. "
        "In ordinary least squares, the parameters are estimated by minimizing the sum of squared residuals between the observed targets and the predictions."
    )
    chunks = rag_service.chunk_text(sample_text, chunk_size=120, overlap=30)
    assert len(chunks) >= 2

    # Vector similarity math
    vec_a = VectorEngine.compute_dense_vector("linear regression ordinary least squares")
    vec_b = VectorEngine.compute_dense_vector("linear regression residuals squared")
    vec_c = VectorEngine.compute_dense_vector("ancient roman architecture amphitheatres")

    sim_ab = VectorEngine.cosine_similarity(vec_a, vec_b)
    sim_ac = VectorEngine.cosine_similarity(vec_a, vec_c)

    assert sim_ab > sim_ac
    assert sim_ab > 0.3

@pytest.mark.anyio
async def test_rag_query_with_citations_and_anti_hallucination():
    db = TestingSessionLocal()
    try:
        # Register Teacher & Student
        client.post("/api/v1/auth/register", json={
            "name": "Teacher RAG",
            "email": "teacher.rag@univ.edu",
            "password": "ragpass123",
            "role": "TEACHER"
        })
        t_tok = client.post("/api/v1/auth/login", json={
            "email": "teacher.rag@univ.edu",
            "password": "ragpass123"
        }).json()["access_token"]
        t_headers = {"Authorization": f"Bearer {t_tok}"}

        client.post("/api/v1/auth/register", json={
            "name": "Student RAG",
            "email": "student.rag@univ.edu",
            "password": "ragpass123",
            "role": "STUDENT"
        })
        s_tok = client.post("/api/v1/auth/login", json={
            "email": "student.rag@univ.edu",
            "password": "ragpass123"
        }).json()["access_token"]
        s_headers = {"Authorization": f"Bearer {s_tok}"}

        # Create Subject
        sub = client.post("/api/v1/subjects", json={
            "name": "Machine Learning Notes",
            "description": "Supervised Learning"
        }, headers=t_headers).json()
        subject_id = sub["id"]

        # Insert Mock Approved Document with Extracted Pages
        from app.models.user import Teacher
        teacher_rec = db.query(Teacher).first()
        doc = Document(
            title="Introduction to Machine Learning",
            original_filename="intro_ml.pdf",
            storage_path="mock/path.pdf",
            file_size=1024,
            mime_type="application/pdf",
            page_count=2,
            status=DocumentStatus.APPROVED,
            subject_id=subject_id,
            uploaded_by=teacher_rec.id
        )
        db.add(doc)
        db.flush()

        p1 = ExtractedContent(
            document_id=doc.id,
            page_number=1,
            content_text=(
                "Overfitting occurs when an algorithm models the training data too well. "
                "This happens when a model learns the detail and noise in the training data to the extent that it negatively impacts the performance of the model on new data. "
                "Techniques to prevent overfitting include cross-validation, regularization like L1 and L2, and early stopping."
            )
        )
        p2 = ExtractedContent(
            document_id=doc.id,
            page_number=2,
            content_text=(
                "Linear regression minimizes the residual sum of squares between observed targets in the dataset and the targets predicted by linear approximation."
            )
        )
        db.add_all([p1, p2])
        db.commit()

        # Index the document
        chunks_indexed = await rag_service.index_document(doc.id, db)
        assert chunks_indexed >= 2

        # 1. Query verified concept present in material (Overfitting)
        res_valid = client.post("/api/v1/rag/query", json={
            "subject_id": subject_id,
            "question": "What is overfitting and how do we prevent it?"
        }, headers=s_headers)
        assert res_valid.status_code == 200
        val_data = res_valid.json()
        assert val_data["source_found"] is True
        assert len(val_data["citations"]) > 0
        citation = val_data["citations"][0]
        assert citation["document_title"] == "Introduction to Machine Learning"
        assert citation["page_number"] == 1
        assert "overfitting" in val_data["answer"].lower()

        # 2. Query unverified concept not in material (Anti-Hallucination Layer check)
        res_hallucination = client.post("/api/v1/rag/query", json={
            "subject_id": subject_id,
            "question": "How do you manufacture quantum semiconductor wafers for cryogenic space missions?"
        }, headers=s_headers)
        assert res_hallucination.status_code == 200
        hal_data = res_hallucination.json()
        assert hal_data["source_found"] is False
        assert "I couldn't find enough information about this topic in the uploaded material." in hal_data["answer"]
        assert len(hal_data["citations"]) == 0
    finally:
        db.close()
