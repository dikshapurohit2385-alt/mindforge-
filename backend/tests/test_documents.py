import io
import fitz
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.document_service import process_document_pipeline
from tests.conftest import TestingSessionLocal

client = TestClient(app)

def create_sample_pdf_bytes(title: str = "Unit 1: Quantum Mechanics", body: str = "Quantum mechanics explains the behavior of energy and matter.") -> bytes:
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 72), f"Chapter 1: {title}\n\n{body}\n\nKey Concepts:\n- Wave-particle duality\n- Heisenberg uncertainty principle\n- Schrodinger equation")
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes

def register_and_login(email: str, role: str, name: str):
    client.post("/api/v1/auth/register", json={
        "name": name,
        "email": email,
        "password": "password123",
        "role": role,
        "class_name": "Grade 12" if role == "STUDENT" else None
    })
    res = client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "password123"
    })
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_document_full_lifecycle():
    teacher_headers = register_and_login("prof.smith@school.com", "TEACHER", "Prof. Smith")
    student_headers = register_and_login("timmy@school.com", "STUDENT", "Timmy Learner")

    # 1. Teacher creates subject, chapter, and module
    sub_res = client.post("/api/v1/subjects", json={"name": "Physics 101", "description": "Intro physics"}, headers=teacher_headers)
    assert sub_res.status_code == 201
    subject_id = sub_res.json()["id"]

    chap_res = client.post(f"/api/v1/subjects/{subject_id}/chapters", json={"title": "Thermodynamics"}, headers=teacher_headers)
    assert chap_res.status_code == 201
    chapter_id = chap_res.json()["id"]

    mod_res = client.post(f"/api/v1/chapters/{chapter_id}/modules", json={"title": "Laws of Heat"}, headers=teacher_headers)
    assert mod_res.status_code == 201
    module_id = mod_res.json()["id"]

    # 2. Reject non-PDF or corrupt file upload
    bad_file = io.BytesIO(b"Hello world, I am not a PDF")
    bad_upload = client.post(
        "/api/v1/documents/upload",
        data={"title": "Fake PDF", "subject_id": subject_id},
        files={"file": ("fake.txt", bad_file, "text/plain")},
        headers=teacher_headers
    )
    assert bad_upload.status_code == 400
    assert "PDF" in bad_upload.json()["detail"]

    # 3. Student cannot upload document (403)
    pdf_bytes = create_sample_pdf_bytes()
    student_upload = client.post(
        "/api/v1/documents/upload",
        data={"title": "Unauthorized Upload", "subject_id": subject_id},
        files={"file": ("notes.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
        headers=student_headers
    )
    assert student_upload.status_code == 403

    # 4. Teacher uploads valid PDF
    upload_res = client.post(
        "/api/v1/documents/upload",
        data={
            "title": "Thermodynamics Core Lecture",
            "subject_id": subject_id,
            "chapter_id": chapter_id,
            "module_id": module_id
        },
        files={"file": ("thermo_core.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
        headers=teacher_headers
    )
    assert upload_res.status_code == 201
    doc_data = upload_res.json()
    doc_id = doc_data["id"]
    assert doc_data["title"] == "Thermodynamics Core Lecture"
    assert doc_data["status"] == "UPLOADED"
    assert doc_data["subject_name"] == "Physics 101"

    # 5. Process document pipeline synchronously to test extraction & structuring
    # (Since background tasks in TestClient run at response completion or can be manually run against test db)
    tdb = TestingSessionLocal()
    try:
        process_document_pipeline(doc_id, db=tdb)
    finally:
        tdb.close()
    
    # Check document status after processing
    detail_res = client.get(f"/api/v1/documents/{doc_id}", headers=teacher_headers)
    assert detail_res.status_code == 200
    processed_doc = detail_res.json()
    assert processed_doc["status"] == "REVIEW_REQUIRED"
    assert processed_doc["page_count"] >= 1
    assert len(processed_doc["contents"]) >= 1

    content_item = processed_doc["contents"][0]
    content_id = content_item["id"]
    assert "Quantum mechanics" in content_item["content_text"] or "Chapter 1" in content_item["content_text"]
    assert content_item["is_edited"] is False
    assert content_item["structured_data"] is not None

    # 6. Student cannot see document while status is REVIEW_REQUIRED
    student_list = client.get("/api/v1/documents", headers=student_headers)
    assert student_list.status_code == 200
    assert len(student_list.json()) == 0

    student_detail = client.get(f"/api/v1/documents/{doc_id}", headers=student_headers)
    assert student_detail.status_code == 403

    # 7. Teacher edits extracted content
    edit_res = client.put(
        f"/api/v1/documents/{doc_id}/content/{content_id}",
        json={
            "content_text": "Updated content: Thermodynamics explains heat engines and entropy.",
            "structured_data": {
                "page": 1,
                "title": "Thermodynamics Intro (Edited)",
                "headings": ["Thermodynamics Intro (Edited)"],
                "sections": [{"type": "paragraph", "text": "Updated content: Thermodynamics explains heat engines and entropy."}],
                "learning_topics": ["Heat", "Entropy", "Engines"],
                "has_tables": False,
                "confidence_score": 1.0
            }
        },
        headers=teacher_headers
    )
    assert edit_res.status_code == 200
    assert edit_res.json()["is_edited"] is True
    assert "heat engines" in edit_res.json()["content_text"]

    # 8. Teacher approves document
    review_res = client.post(
        f"/api/v1/documents/{doc_id}/review",
        json={"status": "APPROVED", "comment": "Approved for Grade 12 students."},
        headers=teacher_headers
    )
    assert review_res.status_code == 200
    assert review_res.json()["status"] == "APPROVED"
    assert review_res.json()["review_comment"] == "Approved for Grade 12 students."

    # 9. Now student CAN list and view the approved document
    student_list_after = client.get("/api/v1/documents", headers=student_headers)
    assert student_list_after.status_code == 200
    assert len(student_list_after.json()) == 1
    assert student_list_after.json()[0]["id"] == doc_id

    student_content = client.get(f"/api/v1/documents/{doc_id}/content", headers=student_headers)
    assert student_content.status_code == 200
    assert len(student_content.json()) == 1
    assert "heat engines" in student_content.json()[0]["content_text"]

    # 10. File download
    dl_res = client.get(f"/api/v1/documents/{doc_id}/download", headers=student_headers)
    assert dl_res.status_code == 200
    assert dl_res.headers["content-type"] == "application/pdf"

    # 11. Teacher deletes document
    del_res = client.delete(f"/api/v1/documents/{doc_id}", headers=teacher_headers)
    assert del_res.status_code == 204

    # Verify deleted
    get_after_del = client.get(f"/api/v1/documents/{doc_id}", headers=teacher_headers)
    assert get_after_del.status_code == 404


def test_document_authorization_and_rejection():
    teacher_a = register_and_login("prof.a@school.com", "TEACHER", "Prof. Alice")
    teacher_b = register_and_login("prof.b@school.com", "TEACHER", "Prof. Bob")
    student = register_and_login("stacy@school.com", "STUDENT", "Stacy Student")

    # Teacher A creates subject
    sub_res = client.post("/api/v1/subjects", json={"name": "Chemistry 101", "description": "General Chemistry"}, headers=teacher_a)
    assert sub_res.status_code == 201
    subject_id = sub_res.json()["id"]

    pdf_bytes = create_sample_pdf_bytes("Organic Molecules", "Alkanes, alkenes, and alkynes.")

    # Teacher B tries to upload to Teacher A's subject -> 403
    t_b_upload = client.post(
        "/api/v1/documents/upload",
        data={"title": "Unauthorized Chemistry Note", "subject_id": subject_id},
        files={"file": ("chem.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
        headers=teacher_b
    )
    assert t_b_upload.status_code == 403

    # Teacher A uploads successfully
    t_a_upload = client.post(
        "/api/v1/documents/upload",
        data={"title": "Organic Chemistry Fundamentals", "subject_id": subject_id},
        files={"file": ("chem.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
        headers=teacher_a
    )
    assert t_a_upload.status_code == 201
    doc_id = t_a_upload.json()["id"]

    # Process pipeline
    tdb = TestingSessionLocal()
    try:
        process_document_pipeline(doc_id, db=tdb)
    finally:
        tdb.close()

    # Teacher B tries to review Teacher A's document -> 403
    t_b_review = client.post(
        f"/api/v1/documents/{doc_id}/review",
        json={"status": "APPROVED", "comment": "Malicious review attempt"},
        headers=teacher_b
    )
    assert t_b_review.status_code == 403

    # Teacher A rejects document with comment
    t_a_reject = client.post(
        f"/api/v1/documents/{doc_id}/review",
        json={"status": "REJECTED", "comment": "Formulas are missing charge notation. Please re-upload."},
        headers=teacher_a
    )
    assert t_a_reject.status_code == 200
    assert t_a_reject.json()["status"] == "REJECTED"
    assert t_a_reject.json()["review_comment"] == "Formulas are missing charge notation. Please re-upload."

    # Student cannot see REJECTED document
    student_docs = client.get("/api/v1/documents", headers=student)
    assert len(student_docs.json()) == 0

    student_view = client.get(f"/api/v1/documents/{doc_id}", headers=student)
    assert student_view.status_code == 403

