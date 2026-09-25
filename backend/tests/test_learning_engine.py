import pytest
from fastapi.testclient import TestClient
from app.main import app
from tests.conftest import TestingSessionLocal

client = TestClient(app)

def test_phase3_learning_engine_full_workflow():
    # 1. Register Teacher & Create Subject/Chapter/Module
    t_reg = client.post("/api/v1/auth/register", json={
        "name": "Prof. Alan Turing",
        "email": "turing@univ.edu",
        "password": "turingpassword123",
        "role": "TEACHER"
    })
    assert t_reg.status_code in [200, 201]

    t_tok = client.post("/api/v1/auth/login", json={
        "email": "turing@univ.edu",
        "password": "turingpassword123"
    }).json()["access_token"]
    t_headers = {"Authorization": f"Bearer {t_tok}"}

    sub_res = client.post("/api/v1/subjects", json={
        "name": "Machine Learning",
        "description": "Adaptive ML track"
    }, headers=t_headers)
    subject_id = sub_res.json()["id"]

    chap_res = client.post(f"/api/v1/subjects/{subject_id}/chapters", json={
        "title": "Foundations",
        "order_index": 1
    }, headers=t_headers)
    chapter_id = chap_res.json()["id"]

    mod_res = client.post(f"/api/v1/chapters/{chapter_id}/modules", json={
        "title": "Linear Regression",
        "description": "OLS and gradient descent",
        "order_index": 1
    }, headers=t_headers)
    module_id = mod_res.json()["id"]

    # 2. Register Student & Login
    client.post("/api/v1/auth/register", json={
        "name": "Alex Student",
        "email": "alex.ai@student.edu",
        "password": "studentpassword123",
        "role": "STUDENT"
    })
    s_tok = client.post("/api/v1/auth/login", json={
        "email": "alex.ai@student.edu",
        "password": "studentpassword123"
    }).json()["access_token"]
    s_headers = {"Authorization": f"Bearer {s_tok}"}

    # 3. Test Student Profile (3.1)
    prof_res = client.get("/api/v1/profile/me", headers=s_headers)
    assert prof_res.status_code == 200
    prof = prof_res.json()
    assert prof["student_name"] == "Alex Student"
    assert prof["knowledge_level"] == "BEGINNER"

    # Update preferences
    pref_res = client.put("/api/v1/profile/me/preferences", json={
        "learning_speed": "FAST",
        "preferred_content_format": "CODE"
    }, headers=s_headers)
    assert pref_res.status_code == 200
    assert pref_res.json()["learning_speed"] == "FAST"

    # 4. Test Diagnostic Assessment (3.2)
    diag_qs = client.get(f"/api/v1/diagnostic/{subject_id}/questions", headers=s_headers)
    assert diag_qs.status_code == 200
    questions = diag_qs.json()
    assert len(questions) > 0

    # Submit diagnostic answers
    answers_map = {q["id"]: 0 for q in questions} # select first option
    diag_sub = client.post(f"/api/v1/diagnostic/{subject_id}/submit", json={
        "answers": answers_map
    }, headers=s_headers)
    assert diag_sub.status_code == 200
    diag_report = diag_sub.json()
    assert "assigned_level" in diag_report
    assert len(diag_report["topic_results"]) > 0

    # 5. Test Adaptive Learning Path (3.3)
    path_res = client.get(f"/api/v1/learning-path/{subject_id}", headers=s_headers)
    assert path_res.status_code == 200
    path = path_res.json()
    assert path["total_modules"] >= 1
    assert len(path["modules"]) >= 1

    # Mark module complete
    comp_res = client.post(f"/api/v1/learning-path/module/{module_id}/complete", headers=s_headers)
    assert comp_res.status_code == 200

    # 6. Test Adaptive Content & Personalized Notes (3.4 & 3.5)
    exp_res = client.post("/api/v1/adaptive-content/explain", json={
        "subject_id": subject_id,
        "module_id": module_id,
        "topic_title": "Linear Regression",
        "format_type": "CODE"
    }, headers=s_headers)
    assert exp_res.status_code == 200
    assert "Linear Regression" in exp_res.json()["content"]

    notes_res = client.post("/api/v1/adaptive-content/generate-notes", json={
        "subject_id": subject_id,
        "module_id": module_id,
        "topic_title": "Linear Regression"
    }, headers=s_headers)
    assert notes_res.status_code == 200
    note_data = notes_res.json()
    assert "key_concepts" in note_data
    assert "simple_explanation" in note_data
    assert len(note_data["common_mistakes"]) > 0

    # 7. Test AI Flashcards & SM-2 Spaced Repetition (3.6 & 3.7)
    fc_gen = client.post("/api/v1/flashcards/generate", json={
        "subject_id": subject_id,
        "module_id": module_id,
        "topic_title": "Linear Regression",
        "count": 3
    }, headers=s_headers)
    assert fc_gen.status_code == 200
    cards = fc_gen.json()
    assert len(cards) >= 1

    # Rate flashcard
    card_id = cards[0]["id"]
    rev_res = client.post(f"/api/v1/flashcards/{card_id}/review", json={
        "rating": "GOOD"
    }, headers=s_headers)
    assert rev_res.status_code == 200
    assert rev_res.json()["rating"] == "GOOD"

    # Rate another with AGAIN (triggers revision item)
    if len(cards) > 1:
        client.post(f"/api/v1/flashcards/{cards[1]['id']}/review", json={
            "rating": "AGAIN"
        }, headers=s_headers)

    # Check Revision Queue
    rev_queue = client.get("/api/v1/revision/queue", headers=s_headers)
    assert rev_queue.status_code == 200

    # 8. Test Dynamic Quiz System (3.8)
    quiz_gen = client.post("/api/v1/quizzes/generate", json={
        "subject_id": subject_id,
        "module_id": module_id,
        "topic_title": "Linear Regression",
        "difficulty": "ADAPTIVE",
        "question_count": 3
    }, headers=s_headers)
    assert quiz_gen.status_code == 200
    quiz_data = quiz_gen.json()
    quiz_id = quiz_data["id"]

    # Submit quiz attempt
    q_answers = {q["id"]: 0 for q in quiz_data["questions"]}
    submit_res = client.post(f"/api/v1/quizzes/{quiz_id}/submit", json={
        "answers": q_answers
    }, headers=s_headers)
    assert submit_res.status_code == 200
    assert "score" in submit_res.json()
    assert "concept_breakdown" in submit_res.json()

    # 9. Test Recommendations Engine (4.10)
    rec_res = client.get("/api/v1/recommendations", headers=s_headers)
    assert rec_res.status_code == 200
    assert len(rec_res.json()) > 0

    # 10. Test Teacher Analytics & Assistant (4.7, 4.8, 4.9)
    overview_res = client.get("/api/v1/teacher/analytics/overview", headers=t_headers)
    assert overview_res.status_code == 200
    assert "average_class_progress" in overview_res.json()

    cohort_res = client.get("/api/v1/teacher/analytics/students", headers=t_headers)
    assert cohort_res.status_code == 200
    assert len(cohort_res.json()) >= 1

    student_id = cohort_res.json()[0]["student_id"]
    detail_res = client.get(f"/api/v1/teacher/analytics/students/{student_id}", headers=t_headers)
    assert detail_res.status_code == 200
    assert "recommended_intervention" in detail_res.json()

    # Teacher Assistant AI Generation
    gen_assistant = client.post("/api/v1/teacher/assistant/generate", json={
        "subject_id": subject_id,
        "content_type": "QUIZ",
        "topic": "SQL Joins",
        "difficulty": "MEDIUM",
        "item_count": 3
    }, headers=t_headers)
    assert gen_assistant.status_code == 200
    assert len(gen_assistant.json()["generated_data"]) == 3
