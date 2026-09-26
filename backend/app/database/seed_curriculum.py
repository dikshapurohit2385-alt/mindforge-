from datetime import datetime, timezone, timedelta, date
from sqlalchemy.orm import Session
from app.models.user import User, Teacher, Student, UserRole
from app.models.academic import Subject, Chapter, Module, SchoolClass, AttendanceRecord, AttendanceStatus
from app.models.learning_engine import (
    DiagnosticQuestion,
    Quiz,
    QuizQuestion,
    Flashcard,
    KnowledgeNode,
    KnowledgeEdge,
    StudentLearningProfile,
    ConceptMastery
)

def seed_sample_curriculum(db: Session):
    """
    Populates sample curriculum hierarchy (Class 6 - 10), subjects, knowledge graphs,
    diagnostic tests, quizzes, flashcards, and attendance logs.
    """
    # 1. Seed School Classes
    classes_spec = [
        {"name": "Class 6", "grade": 6},
        {"name": "Class 7", "grade": 7},
        {"name": "Class 8", "grade": 8},
        {"name": "Class 9", "grade": 9},
        {"name": "Class 10", "grade": 10},
    ]

    classes_map = {}
    for cspec in classes_spec:
        sc = db.query(SchoolClass).filter(SchoolClass.name == cspec["name"]).first()
        if not sc:
            sc = SchoolClass(name=cspec["name"], grade_level=cspec["grade"])
            db.add(sc)
            db.flush()
        classes_map[cspec["name"]] = sc

    db.commit()

    # Find or verify teacher & student
    teacher_user = db.query(User).filter(User.role == UserRole.TEACHER).first()
    if not teacher_user:
        return
    teacher_profile = db.query(Teacher).filter(Teacher.user_id == teacher_user.id).first()
    if not teacher_profile:
        return

    student_user = db.query(User).filter(User.role == UserRole.STUDENT).first()
    student_profile = db.query(Student).filter(Student.user_id == student_user.id).first() if student_user else None

    # Check if subjects already exist
    existing_subject = db.query(Subject).first()
    if existing_subject:
        # Check if subject class_id is missing and associate it
        c9 = classes_map.get("Class 9")
        if c9:
            subs = db.query(Subject).all()
            for s in subs:
                if not s.class_id:
                    s.class_id = c9.id
                    s.class_name = c9.name
            db.commit()
        return

    print("[MindForge] Seeding Class 6 - 10 curriculum structure and attendance data...")

    # Class 9 Subjects & Chapters
    c9 = classes_map["Class 9"]
    c10 = classes_map["Class 10"]

    # Subject 1: Class 9 Science
    c9_sci = Subject(
        name="Science (Class 9)",
        description="NCERT Class 9 Science covering Matter, Atoms, Molecules, Structure of the Atom, and Motion.",
        teacher_id=teacher_profile.id,
        class_id=c9.id,
        class_name=c9.name
    )
    db.add(c9_sci)

    # Subject 2: Class 9 Mathematics
    c9_math = Subject(
        name="Mathematics (Class 9)",
        description="NCERT Class 9 Mathematics covering Number Systems, Polynomials, Coordinate Geometry, and Triangles.",
        teacher_id=teacher_profile.id,
        class_id=c9.id,
        class_name=c9.name
    )
    db.add(c9_math)

    # Subject 3: Class 10 Science
    c10_sci = Subject(
        name="Science (Class 10)",
        description="NCERT Class 10 Science covering Chemical Reactions, Acids, Bases and Salts, and Life Processes.",
        teacher_id=teacher_profile.id,
        class_id=c10.id,
        class_name=c10.name
    )
    db.add(c10_sci)

    db.flush()

    # Chapters for Class 9 Science
    sci_chaps = [
        {
            "title": "Structure of the Atom",
            "desc": "Subatomic particles, Thomson model, Rutherford nuclear model, and Bohr planetary model.",
            "modules": [
                {"title": "Subatomic Particles (Protons, Neutrons, Electrons)", "desc": "Discovery, charge, and mass relationships.", "order": 1},
                {"title": "Atomic Models (Rutherford & Bohr)", "desc": "Alpha scattering experiment and energy orbits.", "order": 2},
                {"title": "Valency & Atomic Number", "desc": "Electronic configurations and octet stability.", "order": 3}
            ]
        },
        {
            "title": "Matter in Our Surroundings",
            "desc": "Physical nature of matter, states of matter, and latent heat of vaporization.",
            "modules": [
                {"title": "States of Matter & Particle Theory", "desc": "Solids, liquids, gases, and kinetic energy.", "order": 1},
                {"title": "Evaporation & Latent Heat", "desc": "Cooling effect of evaporation and phase transitions.", "order": 2}
            ]
        },
        {
            "title": "Atoms and Molecules",
            "desc": "Laws of chemical combination, Dalton's atomic theory, and chemical formulae.",
            "modules": [
                {"title": "Laws of Chemical Combination", "desc": "Conservation of mass and definite proportions.", "order": 1},
                {"title": "Mole Concept & Formula Mass", "desc": "Avogadro's constant and molar calculations.", "order": 2}
            ]
        }
    ]

    all_sci_mods = []
    for idx, c_data in enumerate(sci_chaps):
        chap = Chapter(
            subject_id=c9_sci.id,
            title=c_data["title"],
            description=c_data["desc"],
            order_index=idx + 1
        )
        db.add(chap)
        db.flush()

        for m_data in c_data["modules"]:
            mod = Module(
                chapter_id=chap.id,
                title=m_data["title"],
                description=m_data["desc"],
                order_index=m_data["order"]
            )
            db.add(mod)
            db.flush()
            all_sci_mods.append(mod)

    # Seed Knowledge Nodes & Edges for Class 9 Science
    nodes = []
    for idx, mod in enumerate(all_sci_mods):
        diff = "BEGINNER" if idx < 2 else ("INTERMEDIATE" if idx < 5 else "ADVANCED")
        kn = KnowledgeNode(
            subject_id=c9_sci.id,
            module_id=mod.id,
            name=mod.title,
            description=mod.description,
            difficulty=diff,
            order_index=idx
        )
        db.add(kn)
        db.flush()
        nodes.append(kn)

    edges_spec = [(0, 1), (1, 2), (2, 3), (3, 4), (4, 5)]
    for src_idx, tgt_idx in edges_spec:
        edge = KnowledgeEdge(
            source_node_id=nodes[src_idx].id,
            target_node_id=nodes[tgt_idx].id,
            relationship_type="PREREQUISITE"
        )
        db.add(edge)

    # Seed Diagnostic Questions for Class 9 Science
    diag_seeds = [
        {
            "concept": "Subatomic Particles",
            "q": "Which subatomic particle carries a negative electric charge?",
            "opts": ["Electron", "Proton", "Neutron", "Alpha Particle"],
            "ans": 0,
            "diff": "EASY",
            "exp": "Electrons are negatively charged subatomic particles orbiting the atomic nucleus."
        },
        {
            "concept": "Atomic Models",
            "q": "What did Rutherford's gold foil experiment demonstrate about the structure of an atom?",
            "opts": [
                "The atom is a solid uniform sphere of positive charge",
                "Most of the atom is empty space with a dense positive nucleus",
                "Electrons are stationary at fixed positions",
                "Neutrons are the only subatomic particles present"
            ],
            "ans": 1,
            "diff": "MEDIUM",
            "exp": "The deflection of alpha particles showed that mass and positive charge are concentrated in a tiny central nucleus."
        },
        {
            "concept": "Valency",
            "q": "What is the maximum number of electrons that can be accommodated in the innermost K-shell of an atom?",
            "opts": ["2", "8", "18", "32"],
            "ans": 0,
            "diff": "EASY",
            "exp": "According to Bohr-Bury scheme 2n^2, for n=1 (K-shell) max capacity is 2(1)^2 = 2 electrons."
        },
        {
            "concept": "Mole Concept",
            "q": "What is the numerical value of Avogadro's constant?",
            "opts": ["6.022 x 10^23", "3.00 x 10^8", "1.602 x 10^-19", "9.81 x 10^3"],
            "ans": 0,
            "diff": "MEDIUM",
            "exp": "One mole of any substance contains exactly 6.022 x 10^23 representative particles."
        }
    ]
    for d in diag_seeds:
        dq = DiagnosticQuestion(
            subject_id=c9_sci.id,
            concept=d["concept"],
            question=d["q"],
            options=d["opts"],
            correct_option_index=d["ans"],
            difficulty=d["diff"],
            explanation=d["exp"]
        )
        db.add(dq)

    # Seed Quiz for Class 9 Science
    quiz = Quiz(
        title="Formative Check: Atomic Structure & Valency",
        subject_id=c9_sci.id,
        module_id=all_sci_mods[0].id,
        difficulty="MEDIUM",
        is_ai_generated=False,
        is_published=True,
        created_by=teacher_profile.id
    )
    db.add(quiz)
    db.flush()

    qq_list = [
        {
            "q": "What is the mass of a neutron relative to a proton?",
            "opts": ["Approximately equal (1 amu)", "Half the mass", "Negligible (1/1836 amu)", "Twice the mass"],
            "ans": 0,
            "exp": "Protons and neutrons both have a relative mass of approximately 1 atomic mass unit.",
            "concept": "Subatomic Particles",
            "diff": "EASY"
        },
        {
            "q": "An element has atomic number 11 (Sodium). What is its electronic configuration?",
            "opts": ["2, 8, 1", "2, 9", "8, 3", "2, 2, 7"],
            "ans": 0,
            "exp": "K-shell=2, L-shell=8, M-shell=1 (total 11 electrons).",
            "concept": "Valency",
            "diff": "MEDIUM"
        }
    ]
    for q in qq_list:
        qq = QuizQuestion(
            quiz_id=quiz.id,
            question=q["q"],
            options=q["opts"],
            correct_option_index=q["ans"],
            explanation=q["exp"],
            concept_tag=q["concept"],
            difficulty=q["diff"]
        )
        db.add(qq)

    # Seed Flashcards
    fc_list = [
        {
            "q": "What defines the atomic number of an element?",
            "a": "The total number of protons present in the nucleus of its atom.",
            "tag": "Subatomic Particles",
            "diff": "EASY"
        },
        {
            "q": "How is valency determined for an element with 6 valence electrons?",
            "a": "Valency = 8 - 6 = 2 (it needs 2 electrons to achieve octet stability).",
            "tag": "Valency",
            "diff": "MEDIUM"
        }
    ]
    for fc in fc_list:
        card = Flashcard(
            subject_id=c9_sci.id,
            module_id=all_sci_mods[0].id,
            front_question=fc["q"],
            back_answer=fc["a"],
            concept_tag=fc["tag"],
            difficulty=fc["diff"],
            created_by="Teacher"
        )
        db.add(card)

    # Seed Sample Attendance Logs for Student
    if student_profile:
        today = date.today()
        # Seed 15 sessions for Science (some Present, some Absent -> ~60% attendance)
        for i in range(15):
            past_date = today - timedelta(days=(i * 2))
            st_val = AttendanceStatus.PRESENT if (i % 3 != 0) else AttendanceStatus.ABSENT
            rec = AttendanceRecord(
                student_id=student_profile.id,
                class_id=c9.id,
                subject_id=c9_sci.id,
                date=past_date,
                status=st_val
            )
            db.add(rec)

        # Seed Mathematics attendance (~85%)
        for i in range(12):
            past_date = today - timedelta(days=(i * 2))
            st_val = AttendanceStatus.PRESENT if (i % 6 != 0) else AttendanceStatus.ABSENT
            rec = AttendanceRecord(
                student_id=student_profile.id,
                class_id=c9.id,
                subject_id=c9_math.id,
                date=past_date,
                status=st_val
            )
            db.add(rec)

    db.commit()
    print("[MindForge] Successfully seeded Class 6 - 10 curriculum, Class 9 Science, Math, and Attendance records!")
