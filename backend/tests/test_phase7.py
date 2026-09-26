from datetime import date
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_phase7_school_classes_and_attendance_and_workspace_workflow():
    # 1. Register Teacher & Student
    t_res = client.post("/api/v1/auth/register", json={
        "name": "Prof. Richard Feynman",
        "email": "feynman.p7@school.edu",
        "password": "feynmanpassword123",
        "role": "TEACHER"
    })
    assert t_res.status_code in [200, 201]

    t_tok = client.post("/api/v1/auth/login", json={
        "email": "feynman.p7@school.edu",
        "password": "feynmanpassword123"
    }).json()["access_token"]
    t_headers = {"Authorization": f"Bearer {t_tok}"}

    s_res = client.post("/api/v1/auth/register", json={
        "name": "Marie Student",
        "email": "marie.p7@school.edu",
        "password": "mariepassword123",
        "role": "STUDENT"
    })
    assert s_res.status_code in [200, 201]

    s_tok = client.post("/api/v1/auth/login", json={
        "email": "marie.p7@school.edu",
        "password": "mariepassword123"
    }).json()["access_token"]
    s_headers = {"Authorization": f"Bearer {s_tok}"}

    # 2. Test Classes Hierarchy
    client.post("/api/v1/classes", json={"name": "Class 9", "grade_level": 9}, headers=t_headers)
    classes_res = client.get("/api/v1/classes", headers=s_headers)
    assert classes_res.status_code == 200
    classes = classes_res.json()
    assert len(classes) >= 1

    c9 = classes[0]
    class_id = c9["id"]

    # Create a Subject assigned to class
    sub_res = client.post("/api/v1/subjects", json={
        "name": "Science (Class 9)",
        "description": "NCERT Class 9 Science",
        "class_id": class_id,
        "class_name": "Class 9"
    }, headers=t_headers)
    assert sub_res.status_code in [200, 201]

    # Get class subjects
    subj_res = client.get(f"/api/v1/classes/{class_id}/subjects", headers=s_headers)
    assert subj_res.status_code == 200
    subjects = subj_res.json()
    assert len(subjects) >= 1
    subject_id = subjects[0]["id"]

    # 3. Test Teacher Marking Attendance
    # Find student profile id
    prof_me = client.get("/api/v1/profile/me", headers=s_headers).json()
    student_id = prof_me["student_id"]

    mark_res = client.post("/api/v1/attendance/teacher/mark", json={
        "class_id": class_id,
        "subject_id": subject_id,
        "date": str(date.today()),
        "records": [
            {"student_id": student_id, "status": "ABSENT"}
        ]
    }, headers=t_headers)
    assert mark_res.status_code == 200

    # 4. Test Student Attendance Summary
    att_sum_res = client.get("/api/v1/attendance/student/me", headers=s_headers)
    assert att_sum_res.status_code == 200
    summaries = att_sum_res.json()
    assert len(summaries) >= 1

    # 5. Test Teacher Roster
    roster_res = client.get(f"/api/v1/attendance/teacher/class/{class_id}/subject/{subject_id}", headers=t_headers)
    assert roster_res.status_code == 200

    # 6. Test Interactive Study Workspace (Highlights & Comments)
    hl_res = client.post("/api/v1/study-workspace/highlights", json={
        "subject_id": subject_id,
        "selected_text": "Subatomic particles like electrons orbit the nucleus",
        "color": "yellow"
    }, headers=s_headers)
    assert hl_res.status_code == 201
    hl_id = hl_res.json()["id"]

    get_hls = client.get(f"/api/v1/study-workspace/highlights?subject_id={subject_id}", headers=s_headers)
    assert get_hls.status_code == 200
    assert len(get_hls.json()) >= 1

    # Comments / Annotations
    cm_res = client.post("/api/v1/study-workspace/comments", json={
        "subject_id": subject_id,
        "selected_text": "Protons have a positive electric charge",
        "comment_text": "Important definition to review for atomic structure exam!"
    }, headers=s_headers)
    assert cm_res.status_code == 201
    cm_id = cm_res.json()["id"]

    # Edit comment
    up_cm = client.put(f"/api/v1/study-workspace/comments/{cm_id}", json={
        "comment_text": "Updated: Protons possess +1 relative charge."
    }, headers=s_headers)
    assert up_cm.status_code == 200
    assert "Updated" in up_cm.json()["comment_text"]

    # 7. Test Ask Teacher Exact Routes
    q_res = client.post("/api/v1/ask-teacher/questions", json={
        "subject_id": subject_id,
        "selected_text": "Valency of Sodium is 1",
        "question": "Why does Sodium readily lose 1 electron?"
    }, headers=s_headers)
    assert q_res.status_code == 201
    question_id = q_res.json()["id"]

    # Student my-questions
    my_qs = client.get("/api/v1/ask-teacher/my-questions", headers=s_headers)
    assert my_qs.status_code == 200
    assert len(my_qs.json()) >= 1

    # Teacher inbox
    inbox_res = client.get("/api/v1/ask-teacher/inbox", headers=t_headers)
    assert inbox_res.status_code == 200
    assert len(inbox_res.json()) >= 1

    # Teacher answer question
    ans_res = client.put(f"/api/v1/ask-teacher/questions/{question_id}/answer", json={
        "answer": "Sodium has 1 valence electron in its outer shell (2,8,1). Losing it achieves a stable noble gas octet.",
        "status": "ANSWERED"
    }, headers=t_headers)
    assert ans_res.status_code == 200
    assert ans_res.json()["status"] == "ANSWERED"
