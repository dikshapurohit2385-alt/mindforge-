from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from app.models.user import User, Teacher, Student, UserRole
from app.models.academic import Subject, Chapter, Module
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
    Populates sample curriculum, knowledge graphs, diagnostic tests, quizzes,
    and flashcards if the database is unpopulated.
    """
    existing_subject = db.query(Subject).first()
    if existing_subject:
        return  # Already seeded or has data

    # Find or create a default Teacher
    teacher_user = db.query(User).filter(User.role == UserRole.TEACHER).first()
    if not teacher_user:
        return
    teacher_profile = db.query(Teacher).filter(Teacher.user_id == teacher_user.id).first()
    if not teacher_profile:
        return

    print("[MindForge] Seeding initial curriculum and adaptive engine data...")

    # 1. Create Subject: Python Programming & Machine Learning
    subj = Subject(
        name="Python & Machine Learning",
        description="Foundational curriculum covering Python syntax, data processing, statistics, and machine learning models.",
        teacher_id=teacher_profile.id
    )
    db.add(subj)
    db.flush()

    # Chapters & Modules
    chapters_data = [
        {
            "title": "Python Essentials",
            "desc": "Foundational programming constructs in Python",
            "order": 1,
            "modules": [
                {"title": "Python Revision", "desc": "Syntax, variables, conditionals and data structures.", "order": 1},
                {"title": "Loops & Iteration", "desc": "For loops, while loops, comprehension and control flow.", "order": 2},
                {"title": "Functions & Scope", "desc": "Function arguments, recursion, decorators, and variable scope.", "order": 3}
            ]
        },
        {
            "title": "Data Processing & Mathematics",
            "desc": "NumPy, Pandas, and foundational statistical reasoning",
            "order": 2,
            "modules": [
                {"title": "NumPy Basics", "desc": "N-dimensional arrays, vectorization, and matrix operations.", "order": 1},
                {"title": "Pandas DataFrames", "desc": "Tabular manipulation, missing data handling, and aggregation.", "order": 2},
                {"title": "Statistics & Probability", "desc": "Distributions, hypothesis testing, mean, variance, covariance.", "order": 3}
            ]
        },
        {
            "title": "Machine Learning Foundations",
            "desc": "Supervised learning algorithms and evaluation metrics",
            "order": 3,
            "modules": [
                {"title": "Linear Regression", "desc": "Cost functions, gradient descent, and ordinary least squares.", "order": 1},
                {"title": "Classification Models", "desc": "Logistic regression, decision trees, and boundary surfaces.", "order": 2},
                {"title": "Model Evaluation", "desc": "Cross-validation, precision, recall, F1-score, and ROC-AUC.", "order": 3}
            ]
        }
    ]

    all_modules = []
    for c_data in chapters_data:
        chap = Chapter(
            subject_id=subj.id,
            title=c_data["title"],
            description=c_data["desc"],
            order_index=c_data["order"]
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
            all_modules.append(mod)

    # 2. Knowledge Graph Nodes & Prerequisite Edges
    # Python -> Loops -> Functions -> NumPy -> Pandas -> Statistics -> Linear Regression -> Classification -> Model Evaluation
    nodes = []
    for idx, mod in enumerate(all_modules):
        diff = "BEGINNER" if idx < 3 else ("INTERMEDIATE" if idx < 6 else "ADVANCED")
        kn = KnowledgeNode(
            subject_id=subj.id,
            module_id=mod.id,
            name=mod.title,
            description=mod.description,
            difficulty=diff,
            order_index=idx
        )
        db.add(kn)
        db.flush()
        nodes.append(kn)

    # Define prerequisite relationships
    # Python Revision -> Loops & Iteration
    # Loops & Iteration -> Functions & Scope
    # Functions & Scope -> NumPy Basics
    # NumPy Basics -> Pandas DataFrames
    # Python Revision + Statistics -> Linear Regression
    edges_spec = [
        (0, 1), # Python Revision -> Loops
        (1, 2), # Loops -> Functions
        (2, 3), # Functions -> NumPy
        (3, 4), # NumPy -> Pandas
        (4, 5), # Pandas -> Statistics
        (3, 6), # NumPy -> Linear Regression
        (5, 6), # Statistics -> Linear Regression (Requires Statistics!)
        (6, 7), # Linear Regression -> Classification
        (7, 8)  # Classification -> Model Evaluation
    ]
    for src_idx, tgt_idx in edges_spec:
        edge = KnowledgeEdge(
            source_node_id=nodes[src_idx].id,
            target_node_id=nodes[tgt_idx].id,
            relationship_type="PREREQUISITE"
        )
        db.add(edge)

    # 3. Diagnostic Questions
    diag_seeds = [
        {
            "concept": "Python Basics",
            "q": "What is the result of type([1, 2, 3]) in Python?",
            "opts": ["<class 'list'>", "<class 'array'>", "<class 'tuple'>", "<class 'vector'>"],
            "ans": 0,
            "diff": "EASY",
            "exp": "Square brackets [ ] define standard mutable list objects in Python."
        },
        {
            "concept": "Loops",
            "q": "Which keyword immediately exits a loop regardless of the test condition?",
            "opts": ["continue", "break", "pass", "yield"],
            "ans": 1,
            "diff": "EASY",
            "exp": "The break statement terminates the enclosing loop execution immediately."
        },
        {
            "concept": "Functions",
            "q": "What is a lambda function in Python?",
            "opts": [
                "A multithreaded asynchronous function",
                "An anonymous inline function defined with the lambda keyword",
                "A built-in mathematical library",
                "A compiler optimization flag"
            ],
            "ans": 1,
            "diff": "MEDIUM",
            "exp": "Lambdas are anonymous single-expression functions."
        },
        {
            "concept": "NumPy & Vectors",
            "q": "What is array broadcasting in NumPy?",
            "opts": [
                "Transmitting array data over local network sockets",
                "Arithmetic operations between arrays of different compatible shapes without copying data",
                "Printing arrays onto standard terminal streams",
                "Converting arrays into JSON format"
            ],
            "ans": 1,
            "diff": "MEDIUM",
            "exp": "Broadcasting describes how NumPy treats arrays with different shapes during arithmetic operations."
        },
        {
            "concept": "Statistics & Calculus",
            "q": "What does the gradient vector indicate in gradient descent optimization?",
            "opts": [
                "The direction of steepest ascent of the loss function",
                "The average execution time of the CPU",
                "The maximum memory address allocated",
                "The number of features in the dataset"
            ],
            "ans": 0,
            "diff": "HARD",
            "exp": "The gradient points in the direction of steepest increase; gradient descent takes steps in the opposite direction."
        }
    ]
    for d in diag_seeds:
        dq = DiagnosticQuestion(
            subject_id=subj.id,
            concept=d["concept"],
            question=d["q"],
            options=d["opts"],
            correct_option_index=d["ans"],
            difficulty=d["diff"],
            explanation=d["exp"]
        )
        db.add(dq)

    # 4. Sample Dynamic Quiz
    quiz = Quiz(
        title="Formative Check: Python & NumPy Basics",
        subject_id=subj.id,
        module_id=all_modules[0].id,
        difficulty="MEDIUM",
        is_ai_generated=False,
        is_published=True,
        created_by=teacher_profile.id
    )
    db.add(quiz)
    db.flush()

    quiz_qs = [
        {
            "q": "Which data structure is immutable in Python?",
            "opts": ["Dictionary", "List", "Tuple", "Set"],
            "ans": 2,
            "exp": "Tuples cannot be altered once instantiated.",
            "concept": "Python Basics",
            "diff": "EASY"
        },
        {
            "q": "What does np.zeros((3, 4)) generate?",
            "opts": [
                "A 1D array with 12 elements",
                "A 3x4 2-dimensional matrix filled with 0.0 values",
                "A dictionary containing 3 keys and 4 values",
                "An empty list"
            ],
            "ans": 1,
            "exp": "np.zeros creates a NumPy array with the specified shape initialized to floating-point zeros.",
            "concept": "NumPy & Vectors",
            "diff": "EASY"
        },
        {
            "q": "What does a negative index like lst[-1] retrieve in Python?",
            "opts": [
                "The first element of the list",
                "The last element of the list",
                "An IndexError",
                "A reversed copy of the entire list"
            ],
            "ans": 1,
            "exp": "Negative indexing in Python counts backward from the end of the collection.",
            "concept": "Python Basics",
            "diff": "EASY"
        }
    ]
    for q in quiz_qs:
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

    # 5. Flashcards
    flashcard_seeds = [
        {
            "q": "What is the computational complexity of indexing an element in a Python list?",
            "a": "O(1) constant time, because lists are implemented as contiguous arrays of pointers.",
            "tag": "Python Basics",
            "diff": "EASY"
        },
        {
            "q": "How does NumPy achieve significantly faster execution than native Python loops?",
            "a": "NumPy operations run in compiled C with contiguous memory buffers and SIMD vectorization.",
            "tag": "NumPy & Vectors",
            "diff": "MEDIUM"
        },
        {
            "q": "What is the difference between Mean Squared Error (MSE) and Mean Absolute Error (MAE)?",
            "a": "MSE squares errors penalizing large outliers more severely, whereas MAE weights all deviations linearly.",
            "tag": "Linear Regression",
            "diff": "MEDIUM"
        },
        {
            "q": "Why is feature scaling critical prior to training gradient-descent based algorithms?",
            "a": "Disparate feature scales distort the loss surface into elongated ellipses, slowing convergence.",
            "tag": "Linear Regression",
            "diff": "HARD"
        }
    ]
    for fc in flashcard_seeds:
        card = Flashcard(
            subject_id=subj.id,
            module_id=all_modules[0].id,
            front_question=fc["q"],
            back_answer=fc["a"],
            concept_tag=fc["tag"],
            difficulty=fc["diff"],
            created_by="Teacher"
        )
        db.add(card)

    db.commit()
    print(f"[MindForge] Successfully seeded subject '{subj.name}' with {len(all_modules)} modules, knowledge graph, diagnostic questions, quizzes, and flashcards.")
