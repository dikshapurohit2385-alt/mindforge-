import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_chapter_diagnostic_and_adaptive_lesson_flow():
    # 1. Register Student
    student_reg = client.post("/api/v1/auth/register", json={
        "name": "Phase5 Student",
        "email": "phase5student@example.com",
        "password": "Password123!",
        "role": "STUDENT",
        "class_name": "Grade 9"
    })
    assert student_reg.status_code == 201

    # 2. Login Student
    student_login = client.post("/api/v1/auth/login", json={
        "email": "phase5student@example.com",
        "password": "Password123!"
    })
    assert student_login.status_code == 200
    student_token = student_login.json()["access_token"]
    student_headers = {"Authorization": f"Bearer {student_token}"}

    # 3. Register Teacher & Create Subject/Chapter
    teacher_reg = client.post("/api/v1/auth/register", json={
        "name": "Phase5 Teacher",
        "email": "phase5teacher@example.com",
        "password": "Password123!",
        "role": "TEACHER"
    })
    teacher_token = client.post("/api/v1/auth/login", json={
        "email": "phase5teacher@example.com",
        "password": "Password123!"
    }).json()["access_token"]
    teacher_headers = {"Authorization": f"Bearer {teacher_token}"}

    subj_resp = client.post("/api/v1/subjects", json={
        "name": "Science Phase 5",
        "description": "Adaptive Physics & Chemistry"
    }, headers=teacher_headers)
    assert subj_resp.status_code in [200, 201]
    subject_id = subj_resp.json()["id"]

    chap_resp = client.post(f"/api/v1/subjects/{subject_id}/chapters", json={
        "title": "Structure of the Atom",
        "description": "Protons, Neutrons, Electrons, and Atomic Models"
    }, headers=teacher_headers)
    assert chap_resp.status_code in [200, 201]
    chapter_id = chap_resp.json()["id"]

    # 4. Get Chapter Diagnostic Questions (Should be 7 questions)
    q_resp = client.get(f"/api/v1/diagnostic/chapter/{chapter_id}/questions", headers=student_headers)
    assert q_resp.status_code == 200
    questions = q_resp.json()
    assert len(questions) == 7

    # 5. Submit Answers (Contradiction scenario: Claims Easy, but gets 0 correct on prior knowledge)
    answers = {}
    for q in questions:
        if q["question_type"] == "PRIOR_KNOWLEDGE":
            answers[q["id"]] = 1 # Wrong answer
        elif q["question_type"] == "DIFFICULTY_PERCEPTION":
            answers[q["id"]] = 0 # "Easy" option (overconfidence trigger)
        elif q["question_type"] == "INTEREST_LEVEL":
            answers[q["id"]] = 3 # High interest
        elif q["question_type"] == "VISUAL_PREFERENCE":
            answers[q["id"]] = 0 # "Diagrams" option
        elif q["question_type"] == "REAL_WORLD_INTEREST":
            answers[q["id"]] = 0 # "Yes, definitely"

    sub_resp = client.post(f"/api/v1/diagnostic/chapter/{chapter_id}/submit", json={"answers": answers}, headers=student_headers)
    assert sub_resp.status_code == 200
    result = sub_resp.json()
    assert result["learner_profile"] is not None
    assert result["learner_profile"]["knowledge_level"] == "foundational"
    assert result["learner_profile"]["contradiction_flag"] == True
    assert "foundations" in result["student_explanation"].lower() or "basics" in result["student_explanation"].lower() or "confidence" in result["student_explanation"].lower()

    # 6. Fetch Chapter Learner Profile
    prof_resp = client.get(f"/api/v1/diagnostic/chapter/{chapter_id}/profile", headers=student_headers)
    assert prof_resp.status_code == 200
    profile = prof_resp.json()
    assert profile["visual_support_need"] == "high"

    # 7. Fetch Chapter Adaptive Lesson
    lesson_resp = client.get(f"/api/v1/adaptive-content/chapter/{chapter_id}/lesson", headers=student_headers)
    assert lesson_resp.status_code == 200
    lesson = lesson_resp.json()
    assert lesson["chapter_id"] == chapter_id
    assert len(lesson["sections"]) >= 5
    # Verify visual component is present
    vis_sections = [s for s in lesson["sections"] if s["visual_component"] is not None]
    assert len(vis_sections) > 0
    assert vis_sections[0]["visual_component"]["type"] in ["flow_diagram", "comparison_table", "concept_map"]
