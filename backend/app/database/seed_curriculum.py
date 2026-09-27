from datetime import datetime, timezone, timedelta, date
from sqlalchemy.orm import Session
from app.core.security import get_password_hash
from app.models.user import User, Teacher, Student, UserRole
from app.models.academic import (
    Subject,
    Chapter,
    Module,
    SchoolClass,
    AttendanceRecord,
    AttendanceStatus,
    StudentNote,
    AskTeacherQuestion,
    QuestionStatus
)
from app.models.learning_engine import (
    DiagnosticQuestion,
    Quiz,
    QuizQuestion,
    Flashcard,
    KnowledgeNode,
    KnowledgeEdge,
    StudentLearningProfile,
    ConceptMastery,
    StudentRecommendation,
    ModuleCompletion
)


def seed_users(db: Session):
    """
    Seeds default standard demo accounts (Teacher and Students) and ensures passwords match documentation.
    """
    accounts = [
        {
            "email": "teacher@onepath.ai",
            "name": "Dr. Sarah Mitchell",
            "role": UserRole.TEACHER,
            "password": "password123",
            "class_name": None
        },
        {
            "email": "student@onepath.ai",
            "name": "Alex Chen",
            "role": UserRole.STUDENT,
            "password": "password123",
            "class_name": "Class 9"
        },
        {
            "email": "bhavyarathore5551@gmail.com",
            "name": "Bhavya Rathore",
            "role": UserRole.STUDENT,
            "password": "123456",
            "class_name": "Class 9"
        },
        {
            "email": "demo@gmail.com",
            "name": "Demo Student",
            "role": UserRole.STUDENT,
            "password": "password123",
            "class_name": "Class 9"
        },
        {
            "email": "student10@onepath.ai",
            "name": "Neha Sharma",
            "role": UserRole.STUDENT,
            "password": "password123",
            "class_name": "Class 10"
        }
    ]

    for acc in accounts:
        user = db.query(User).filter(User.email == acc["email"]).first()
        if not user:
            user = User(
                name=acc["name"],
                email=acc["email"],
                password_hash=get_password_hash(acc["password"]),
                role=acc["role"]
            )
            db.add(user)
            db.flush()
        else:
            user.password_hash = get_password_hash(acc["password"])
            user.name = acc["name"]
            user.role = acc["role"]
            db.flush()

        if acc["role"] == UserRole.TEACHER:
            tp = db.query(Teacher).filter(Teacher.user_id == user.id).first()
            if not tp:
                tp = Teacher(user_id=user.id)
                db.add(tp)
                db.flush()
        elif acc["role"] == UserRole.STUDENT:
            sp = db.query(Student).filter(Student.user_id == user.id).first()
            if not sp:
                sp = Student(user_id=user.id, class_name=acc["class_name"])
                db.add(sp)
                db.flush()
            else:
                sp.class_name = acc["class_name"]
                db.flush()

    db.commit()


def seed_sample_curriculum(db: Session):
    """
    Populates comprehensive, class-isolated demo curriculum:
    - Class 9 Students receive ONLY Class 9 Science and Mathematics data.
    - Class 10 Students receive ONLY Class 10 Science data.
    - Teachers oversee all classes.
    """
    # 0. Ensure schema migrations have applied
    try:
        from app.main import ensure_schema_up_to_date
        ensure_schema_up_to_date(db.get_bind())
    except Exception:
        pass

    # 1. Seed Accounts
    seed_users(db)

    # 2. Seed School Classes
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

    c9 = classes_map["Class 9"]
    c10 = classes_map["Class 10"]

    # Set each student's class_id strictly according to their class_name
    students = db.query(Student).all()
    for s in students:
        target_name = s.class_name if s.class_name in classes_map else "Class 9"
        target_class = classes_map.get(target_name, c9)
        s.class_id = target_class.id
        s.class_name = target_class.name
    db.commit()

    # Find teacher profile
    teacher_user = db.query(User).filter(User.role == UserRole.TEACHER).first()
    teacher_profile = db.query(Teacher).filter(Teacher.user_id == teacher_user.id).first() if teacher_user else None

    if not teacher_profile:
        print("[MindForge Seeding Error]: Teacher profile could not be initialized.")
        return

    # 3. Seed Subjects with explicit class association
    c9_sci = db.query(Subject).filter(Subject.name == "Science (Class 9)").first()
    if not c9_sci:
        c9_sci = Subject(
            name="Science (Class 9)",
            description="NCERT Class 9 Science covering Matter, Atoms, Molecules, Structure of the Atom, and Motion.",
            teacher_id=teacher_profile.id,
            class_id=c9.id,
            class_name=c9.name
        )
        db.add(c9_sci)
        db.flush()
    else:
        c9_sci.class_id = c9.id
        c9_sci.class_name = c9.name
        db.flush()

    c9_math = db.query(Subject).filter(Subject.name == "Mathematics (Class 9)").first()
    if not c9_math:
        c9_math = Subject(
            name="Mathematics (Class 9)",
            description="NCERT Class 9 Mathematics covering Number Systems, Polynomials, Coordinate Geometry, and Triangles.",
            teacher_id=teacher_profile.id,
            class_id=c9.id,
            class_name=c9.name
        )
        db.add(c9_math)
        db.flush()
    else:
        c9_math.class_id = c9.id
        c9_math.class_name = c9.name
        db.flush()

    c10_sci = db.query(Subject).filter(Subject.name == "Science (Class 10)").first()
    if not c10_sci:
        c10_sci = Subject(
            name="Science (Class 10)",
            description="NCERT Class 10 Science covering Chemical Reactions, Acids, Bases and Salts, and Life Processes.",
            teacher_id=teacher_profile.id,
            class_id=c10.id,
            class_name=c10.name
        )
        db.add(c10_sci)
        db.flush()
    else:
        c10_sci.class_id = c10.id
        c10_sci.class_name = c10.name
        db.flush()

    db.commit()

    # 4. Chapters & Modules for Class 9 Science
    all_sci_mods = []
    existing_c9_sci_chaps = db.query(Chapter).filter(Chapter.subject_id == c9_sci.id).count()
    if existing_c9_sci_chaps == 0:
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
        db.commit()
    else:
        all_sci_mods = db.query(Module).join(Chapter).filter(Chapter.subject_id == c9_sci.id).all()

    # Chapters & Modules for Class 9 Mathematics
    math_chaps_count = db.query(Chapter).filter(Chapter.subject_id == c9_math.id).count()
    if math_chaps_count == 0:
        math_chaps = [
            {
                "title": "Number Systems",
                "desc": "Real numbers, irrational numbers, decimal expansions, and laws of exponents.",
                "modules": [
                    {"title": "Irrational Numbers on the Real Line", "desc": "Representing sqrt(2), sqrt(3) geometrically.", "order": 1},
                    {"title": "Operations on Real Numbers & Rationalisation", "desc": "Rationalising denominators and algebraic identities.", "order": 2}
                ]
            },
            {
                "title": "Polynomials",
                "desc": "Degrees of polynomials, Factor Theorem, and Remainder Theorem.",
                "modules": [
                    {"title": "Zeroes of a Polynomial", "desc": "Finding roots and graphical interpretation.", "order": 1},
                    {"title": "Factorisation of Polynomials", "desc": "Splitting middle term and identity expansion.", "order": 2}
                ]
            }
        ]
        for idx, c_data in enumerate(math_chaps):
            chap = Chapter(
                subject_id=c9_math.id,
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
        db.commit()

    # Chapters & Modules for Class 10 Science
    c10_sci_chaps_count = db.query(Chapter).filter(Chapter.subject_id == c10_sci.id).count()
    all_c10_mods = []
    if c10_sci_chaps_count == 0:
        c10_chaps = [
            {
                "title": "Chemical Reactions and Equations",
                "desc": "Chemical changes, writing balanced chemical equations, and types of chemical reactions.",
                "modules": [
                    {"title": "Balancing Chemical Equations", "desc": "Law of conservation of mass in chemical reactions.", "order": 1},
                    {"title": "Types of Reactions (Combination, Decomposition, Redox)", "desc": "Exothermic, endothermic, oxidation and reduction.", "order": 2}
                ]
            },
            {
                "title": "Acids, Bases and Salts",
                "desc": "Indicators, reactions of acids and bases with metals, and the pH scale.",
                "modules": [
                    {"title": "Properties of Acids and Bases", "desc": "Litmus, universal indicators, and neutralization.", "order": 1},
                    {"title": "The pH Scale and Everyday Applications", "desc": "Acidity, basicity, and salts in daily life.", "order": 2}
                ]
            },
            {
                "title": "Life Processes",
                "desc": "Basic processes of life including nutrition, respiration, transportation, and excretion.",
                "modules": [
                    {"title": "Autotrophic & Heterotrophic Nutrition", "desc": "Photosynthesis and human digestive system.", "order": 1},
                    {"title": "Respiration and Circulatory System", "desc": "Aerobic respiration and structure of human heart.", "order": 2}
                ]
            }
        ]
        for idx, c_data in enumerate(c10_chaps):
            chap = Chapter(
                subject_id=c10_sci.id,
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
                all_c10_mods.append(mod)
        db.commit()
    else:
        all_c10_mods = db.query(Module).join(Chapter).filter(Chapter.subject_id == c10_sci.id).all()

    # 5. Knowledge Nodes & Edges for Class 9 Science
    if db.query(KnowledgeNode).filter(KnowledgeNode.subject_id == c9_sci.id).count() == 0 and all_sci_mods:
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
            if src_idx < len(nodes) and tgt_idx < len(nodes):
                edge = KnowledgeEdge(
                    source_node_id=nodes[src_idx].id,
                    target_node_id=nodes[tgt_idx].id,
                    relationship_type="PREREQUISITE"
                )
                db.add(edge)
        db.commit()

    # 6. Diagnostic Questions for Class 9 Science
    if db.query(DiagnosticQuestion).filter(DiagnosticQuestion.subject_id == c9_sci.id).count() == 0:
        first_chap = db.query(Chapter).filter(Chapter.subject_id == c9_sci.id).first()
        diag_seeds = [
            {
                "concept": "Subatomic Particles",
                "q": "Which subatomic particle carries a negative electric charge?",
                "opts": ["Electron", "Proton", "Neutron", "Alpha Particle"],
                "ans": 0,
                "diff": "EASY",
                "type": "PRIOR_KNOWLEDGE",
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
                "type": "PRIOR_KNOWLEDGE",
                "exp": "The deflection of alpha particles showed that mass and positive charge are concentrated in a tiny central nucleus."
            },
            {
                "concept": "Valency",
                "q": "What is the maximum number of electrons that can be accommodated in the innermost K-shell of an atom?",
                "opts": ["2", "8", "18", "32"],
                "ans": 0,
                "diff": "EASY",
                "type": "PRIOR_KNOWLEDGE",
                "exp": "According to Bohr-Bury scheme 2n^2, for n=1 (K-shell) max capacity is 2(1)^2 = 2 electrons."
            },
            {
                "concept": "Mole Concept",
                "q": "What is the numerical value of Avogadro's constant?",
                "opts": ["6.022 x 10^23", "3.00 x 10^8", "1.602 x 10^-19", "9.81 x 10^3"],
                "ans": 0,
                "diff": "MEDIUM",
                "type": "PRIOR_KNOWLEDGE",
                "exp": "One mole of any substance contains exactly 6.022 x 10^23 representative particles."
            },
            {
                "concept": "Learning Style",
                "q": "How do you prefer to grasp new scientific principles best?",
                "opts": [
                    "Step-by-step mathematical derivations and formulas",
                    "Real-world physical analogies and animations",
                    "Summarized cheat-sheets and flashcards",
                    "Hands-on experiments and problem solving"
                ],
                "ans": 1,
                "diff": "EASY",
                "type": "VISUAL_PREFERENCE",
                "exp": "Identifies learner format preferences for adaptive content generation."
            }
        ]
        for d in diag_seeds:
            dq = DiagnosticQuestion(
                subject_id=c9_sci.id,
                chapter_id=first_chap.id if first_chap else None,
                question_type=d["type"],
                concept=d["concept"],
                question=d["q"],
                options=d["opts"],
                correct_option_index=d["ans"],
                difficulty=d["diff"],
                explanation=d["exp"]
            )
            db.add(dq)
        db.commit()

    # 7. Quizzes for Class 9 Science
    if db.query(Quiz).filter(Quiz.subject_id == c9_sci.id).count() == 0 and all_sci_mods:
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
            },
            {
                "q": "Which scientist discovered the electron using the cathode ray experiment?",
                "opts": ["J.J. Thomson", "Ernest Rutherford", "Niels Bohr", "James Chadwick"],
                "ans": 0,
                "exp": "J.J. Thomson discovered the electron in 1897 through his cathode ray tube experiments.",
                "concept": "Subatomic Particles",
                "diff": "EASY"
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
        db.commit()

    # 8. Flashcards for Class 9 Science
    if db.query(Flashcard).filter(Flashcard.subject_id == c9_sci.id).count() == 0 and all_sci_mods:
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
            },
            {
                "q": "What is latent heat of vaporization?",
                "a": "The amount of heat required to convert 1 kg of a liquid into vapor at its boiling point without temperature change.",
                "tag": "States of Matter",
                "diff": "MEDIUM"
            },
            {
                "q": "What are isotopes?",
                "a": "Atoms of the same element having the same atomic number but different mass numbers (e.g. Protium, Deuterium, Tritium).",
                "tag": "Atomic Models",
                "diff": "EASY"
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
        db.commit()

    # 9. Seed Student Data isolated strictly by each student's class
    student_profiles = db.query(Student).all()
    first_c9_chap = db.query(Chapter).filter(Chapter.subject_id == c9_sci.id).first()
    first_c9_mod = all_sci_mods[0] if all_sci_mods else None

    first_c10_chap = db.query(Chapter).filter(Chapter.subject_id == c10_sci.id).first()
    first_c10_mod = all_c10_mods[0] if all_c10_mods else None

    for sp in student_profiles:
        is_class_10 = (sp.class_name == "Class 10")
        target_class = c10 if is_class_10 else c9
        target_subject = c10_sci if is_class_10 else c9_sci
        target_chap = first_c10_chap if is_class_10 else first_c9_chap
        target_mod = first_c10_mod if is_class_10 else first_c9_mod

        # 9a. Attendance records
        att_count = db.query(AttendanceRecord).filter(AttendanceRecord.student_id == sp.id).count()
        if att_count == 0:
            today = date.today()
            if not is_class_10:
                # Class 9 Attendance: 15 Science records (~60%), 12 Math records (~83%)
                for i in range(15):
                    past_date = today - timedelta(days=(i * 2))
                    st_val = AttendanceStatus.PRESENT if (i % 3 != 0) else AttendanceStatus.ABSENT
                    rec = AttendanceRecord(
                        student_id=sp.id,
                        class_id=c9.id,
                        subject_id=c9_sci.id,
                        date=past_date,
                        status=st_val
                    )
                    db.add(rec)

                for i in range(12):
                    past_date = today - timedelta(days=(i * 2))
                    st_val = AttendanceStatus.PRESENT if (i % 6 != 0) else AttendanceStatus.ABSENT
                    rec = AttendanceRecord(
                        student_id=sp.id,
                        class_id=c9.id,
                        subject_id=c9_math.id,
                        date=past_date,
                        status=st_val
                    )
                    db.add(rec)
            else:
                # Class 10 Attendance: 14 Class 10 Science records (~78%)
                for i in range(14):
                    past_date = today - timedelta(days=(i * 2))
                    st_val = AttendanceStatus.PRESENT if (i % 4 != 0) else AttendanceStatus.ABSENT
                    rec = AttendanceRecord(
                        student_id=sp.id,
                        class_id=c10.id,
                        subject_id=c10_sci.id,
                        date=past_date,
                        status=st_val
                    )
                    db.add(rec)
            db.commit()

        # 9b. Student Learning Profile
        slp = db.query(StudentLearningProfile).filter(StudentLearningProfile.student_id == sp.id).first()
        if not slp:
            slp = StudentLearningProfile(
                student_id=sp.id,
                knowledge_level="INTERMEDIATE",
                learning_speed="MODERATE",
                preferred_content_format="SIMPLE",
                learning_preferences={"visual_learner": True, "step_by_step": True},
                overall_progress=72 if is_class_10 else 68,
                quiz_accuracy=85.0 if is_class_10 else 82.0,
                streak_days=6 if is_class_10 else 5,
                last_active_date=datetime.now(timezone.utc)
            )
            db.add(slp)
            db.commit()

        # 9c. Concept Masteries
        cm_count = db.query(ConceptMastery).filter(ConceptMastery.student_id == sp.id).count()
        if cm_count == 0:
            if not is_class_10:
                masteries = [
                    {"concept": "Subatomic Particles", "status": "STRONG", "score": 92, "mistakes": 0},
                    {"concept": "States of Matter", "status": "STRONG", "score": 88, "mistakes": 1},
                    {"concept": "Atomic Models", "status": "MEDIUM", "score": 70, "mistakes": 2},
                    {"concept": "Valency & Octet Rule", "status": "WEAK", "score": 42, "mistakes": 4},
                    {"concept": "Mole Concept", "status": "MEDIUM", "score": 65, "mistakes": 2}
                ]
            else:
                masteries = [
                    {"concept": "Chemical Equations", "status": "STRONG", "score": 90, "mistakes": 0},
                    {"concept": "Acids, Bases & Indicators", "status": "STRONG", "score": 86, "mistakes": 1},
                    {"concept": "The pH Scale", "status": "MEDIUM", "score": 72, "mistakes": 2},
                    {"concept": "Redox Reactions", "status": "WEAK", "score": 48, "mistakes": 3},
                    {"concept": "Life Processes & Nutrition", "status": "MEDIUM", "score": 68, "mistakes": 2}
                ]
            for m in masteries:
                cm = ConceptMastery(
                    student_id=sp.id,
                    subject_id=target_subject.id,
                    concept_name=m["concept"],
                    status=m["status"],
                    score=m["score"],
                    mistakes_count=m["mistakes"],
                    last_evaluated_at=datetime.now(timezone.utc)
                )
                db.add(cm)
            db.commit()

        # 9d. Digital Notebook Notes
        notes_count = db.query(StudentNote).filter(StudentNote.student_id == sp.id).count()
        if notes_count == 0:
            if not is_class_10:
                notes = [
                    {
                        "title": "Bohr-Bury Electron Distribution Rules",
                        "content": "1. Max electrons in shell n is 2n^2 (K=2, L=8, M=18, N=32).\n2. Outermost shell cannot hold more than 8 electrons.\n3. Inner shells must be filled before outer shells."
                    },
                    {
                        "title": "Thomson vs Rutherford vs Bohr Comparison",
                        "content": "• Thomson: Plum pudding, uniform positive charge sphere.\n• Rutherford: Dense positive nucleus in center, mostly empty space.\n• Bohr: Discrete non-radiating energy orbits."
                    },
                    {
                        "title": "Avogadro Constant & Moles Summary",
                        "content": "1 mole = 6.022 x 10^23 particles.\nNumber of moles = Given mass / Molar mass.\nNumber of particles = Number of moles x Avogadro constant."
                    }
                ]
            else:
                notes = [
                    {
                        "title": "Types of Chemical Reactions Summary",
                        "content": "1. Combination: A + B -> AB\n2. Decomposition: AB -> A + B (thermal, electrolytic, photolytic)\n3. Displacement: A + BC -> AC + B\n4. Double Displacement: Precipitation reactions."
                    },
                    {
                        "title": "The pH Scale & Everyday Significance",
                        "content": "• Acidic: pH < 7, Neutral: pH = 7, Basic: pH > 7.\n• Tooth decay starts when mouth pH is below 5.5.\n• Antacids like Magnesium hydroxide (Milk of Magnesia) neutralize stomach excess acid."
                    }
                ]
            for n in notes:
                sn = StudentNote(
                    student_id=sp.id,
                    subject_id=target_subject.id,
                    chapter_id=target_chap.id if target_chap else None,
                    module_id=target_mod.id if target_mod else None,
                    title=n["title"],
                    content=n["content"]
                )
                db.add(sn)
            db.commit()

        # 9e. Ask Teacher Doubts
        doubt_count = db.query(AskTeacherQuestion).filter(AskTeacherQuestion.student_id == sp.id).count()
        if doubt_count == 0 and teacher_profile:
            if not is_class_10:
                doubts = [
                    {
                        "question": "How does Bohr's model explain why orbiting electrons do not radiate energy and fall into the nucleus?",
                        "answer": None,
                        "status": QuestionStatus.PENDING,
                        "answered_at": None
                    },
                    {
                        "question": "Why do noble gases like Helium and Neon have zero valency?",
                        "answer": "Helium has 2 valence electrons filling its K-shell (duplet), and Neon has 8 valence electrons filling its L-shell (octet). Since their outer energy shells are completely full, they do not gain, lose, or share electrons, so their combining capacity (valency) is zero.",
                        "status": QuestionStatus.ANSWERED,
                        "answered_at": datetime.now(timezone.utc)
                    }
                ]
            else:
                doubts = [
                    {
                        "question": "Why does the blue color of copper sulfate solution fade when an iron nail is immersed in it?",
                        "answer": "Iron is more reactive than copper and displaces copper from copper sulfate solution forming light green ferrous sulfate (FeSO4) and depositing brown copper.",
                        "status": QuestionStatus.ANSWERED,
                        "answered_at": datetime.now(timezone.utc)
                    }
                ]
            for d in doubts:
                q = AskTeacherQuestion(
                    student_id=sp.id,
                    teacher_id=teacher_profile.id,
                    subject_id=target_subject.id,
                    chapter_id=target_chap.id if target_chap else None,
                    module_id=target_mod.id if target_mod else None,
                    question=d["question"],
                    answer=d["answer"],
                    status=d["status"],
                    answered_at=d["answered_at"]
                )
                db.add(q)
            db.commit()

        # 9f. Student Recommendations
        rec_count = db.query(StudentRecommendation).filter(StudentRecommendation.student_id == sp.id).count()
        if rec_count == 0:
            if not is_class_10:
                recs = [
                    {
                        "title": "Review Flashcards: Valency & Octet Stability",
                        "desc": "Diagnostic analysis highlights a knowledge gap in calculating valency for group 15-17 elements.",
                        "type": "FLASHCARD",
                        "prio": "HIGH",
                        "reason": "Concept mastery in Valency is currently 42% (Weak)."
                    },
                    {
                        "title": "Practice Quiz: Atomic Models & Subatomic Particles",
                        "desc": "Test your grasp on Rutherford's alpha scattering experiment and Bohr's quantized energy levels.",
                        "type": "QUIZ",
                        "prio": "MEDIUM",
                        "reason": "Prepare for the upcoming formative assessment."
                    },
                    {
                        "title": "Attendance Catch-Up: Structure of the Atom",
                        "desc": "You were absent for 2 recent Science sessions. Review interactive notes and classroom key concepts.",
                        "type": "LEARN",
                        "prio": "HIGH",
                        "reason": "Attendance in Science is currently 60%."
                    }
                ]
            else:
                recs = [
                    {
                        "title": "Review Notes: Redox & Oxidation Reactions",
                        "desc": "Strengthen identification of oxidizing and reducing agents in chemical equations.",
                        "type": "LEARN",
                        "prio": "HIGH",
                        "reason": "Concept mastery in Redox Reactions is currently 48% (Weak)."
                    },
                    {
                        "title": "Practice Quiz: Chemical Reactions & Equations",
                        "desc": "Check your ability to balance complex multi-element chemical equations.",
                        "type": "QUIZ",
                        "prio": "MEDIUM",
                        "reason": "Class 10 Board exam formative check."
                    }
                ]
            for r in recs:
                sr = StudentRecommendation(
                    student_id=sp.id,
                    title=r["title"],
                    description=r["desc"],
                    action_type=r["type"],
                    priority=r["prio"],
                    reason=r["reason"],
                    is_completed=False
                )
                db.add(sr)
            db.commit()

        # 9g. Mark first module completed
        if target_mod:
            mc = db.query(ModuleCompletion).filter(
                ModuleCompletion.student_id == sp.id,
                ModuleCompletion.module_id == target_mod.id
            ).first()
            if not mc:
                mc = ModuleCompletion(
                    student_id=sp.id,
                    module_id=target_mod.id
                )
                db.add(mc)
                db.commit()

    print("[MindForge] Comprehensive, class-isolated demo curriculum, users, and progress successfully seeded!")


if __name__ == "__main__":
    from app.database.session import SessionLocal
    db = SessionLocal()
    try:
        seed_sample_curriculum(db)
    finally:
        db.close()
