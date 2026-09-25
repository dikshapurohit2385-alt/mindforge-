import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_register_and_login_student():
    # Register Student
    response = client.post("/api/v1/auth/register", json={
        "name": "Alex Student",
        "email": "alex@student.com",
        "password": "secretpassword123",
        "role": "STUDENT",
        "class_name": "Grade 11"
    })
    assert response.status_code == 201 or response.status_code == 200
    data = response.json()
    assert data["email"] == "alex@student.com"
    assert data["role"] == "STUDENT"

    # Login Student
    login_res = client.post("/api/v1/auth/login", json={
        "email": "alex@student.com",
        "password": "secretpassword123"
    })
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

def test_teacher_subject_chapter_module_and_ask_teacher_flow():
    # 1. Register Teacher
    t_reg = client.post("/api/v1/auth/register", json={
        "name": "Dr. Sarah Conner",
        "email": "sarah@teacher.com",
        "password": "teacherpass123",
        "role": "TEACHER"
    })
    assert t_reg.status_code in [200, 201]

    # Login Teacher
    t_login = client.post("/api/v1/auth/login", json={
        "email": "sarah@teacher.com",
        "password": "teacherpass123"
    })
    teacher_token = t_login.json()["access_token"]
    t_headers = {"Authorization": f"Bearer {teacher_token}"}

    # 2. Teacher creates subject
    sub_res = client.post("/api/v1/subjects", json={
        "name": "Advanced Physics",
        "description": "Mechanics and Quantum Physics"
    }, headers=t_headers)
    assert sub_res.status_code == 201
    subject_id = sub_res.json()["id"]

    # 3. Teacher creates chapter
    chap_res = client.post(f"/api/v1/subjects/{subject_id}/chapters", json={
        "title": "Quantum Mechanics",
        "description": "Intro to Wave Particle Duality",
        "order_index": 1
    }, headers=t_headers)
    assert chap_res.status_code == 201
    chapter_id = chap_res.json()["id"]

    # 4. Teacher creates module
    mod_res = client.post(f"/api/v1/chapters/{chapter_id}/modules", json={
        "title": "Wave Functions",
        "description": "Schrodinger equation basics",
        "order_index": 1
    }, headers=t_headers)
    assert mod_res.status_code == 201
    module_id = mod_res.json()["id"]

    # 5. Register Student & Login
    client.post("/api/v1/auth/register", json={
        "name": "Bob Learner",
        "email": "bob@student.com",
        "password": "bobpassword123",
        "role": "STUDENT"
    })
    s_login = client.post("/api/v1/auth/login", json={
        "email": "bob@student.com",
        "password": "bobpassword123"
    })
    student_token = s_login.json()["access_token"]
    s_headers = {"Authorization": f"Bearer {student_token}"}

    # 6. Student creates note
    note_res = client.post("/api/v1/notes", json={
        "subject_id": subject_id,
        "chapter_id": chapter_id,
        "module_id": module_id,
        "title": "My Wave Function Summary",
        "content": "Psi represents probability density amplitude."
    }, headers=s_headers)
    assert note_res.status_code == 201
    note_id = note_res.json()["id"]

    # 7. Student lists notes
    get_notes = client.get("/api/v1/notes", headers=s_headers)
    assert get_notes.status_code == 200
    assert len(get_notes.json()) == 1

    # 8. Student submits Ask Teacher question
    q_res = client.post("/api/v1/ask-teacher", json={
        "subject_id": subject_id,
        "chapter_id": chapter_id,
        "module_id": module_id,
        "selected_text": "Psi represents probability density",
        "question": "Does Psi squared equal probability density?"
    }, headers=s_headers)
    assert q_res.status_code == 201
    question_id = q_res.json()["id"]

    # 9. Teacher fetches assigned questions
    t_q_res = client.get("/api/v1/ask-teacher/teacher", headers=t_headers)
    assert t_q_res.status_code == 200
    questions_list = t_q_res.json()
    assert len(questions_list) == 1
    assert questions_list[0]["id"] == question_id

    # 10. Teacher answers question
    ans_res = client.post(f"/api/v1/ask-teacher/{question_id}/answer", json={
        "answer": "Yes, |Psi|^2 represents the probability density of finding a particle.",
        "status": "ANSWERED"
    }, headers=t_headers)
    assert ans_res.status_code == 200
    assert ans_res.json()["status"] == "ANSWERED"

    # 11. Student checks answered questions
    s_q_res = client.get("/api/v1/ask-teacher/student", headers=s_headers)
    assert s_q_res.status_code == 200
    s_questions = s_q_res.json()
    assert len(s_questions) == 1
    assert s_questions[0]["answer"] is not None
