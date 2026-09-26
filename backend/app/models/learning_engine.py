import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Integer, Float, Boolean, DateTime, Enum, ForeignKey, JSON
from sqlalchemy.orm import relationship, backref
from app.database.base import Base

def generate_uuid():
    return str(uuid.uuid4())

class KnowledgeLevel(str, enum.Enum):
    BEGINNER = "BEGINNER"
    INTERMEDIATE = "INTERMEDIATE"
    ADVANCED = "ADVANCED"

class ConceptStatus(str, enum.Enum):
    STRONG = "STRONG"
    MEDIUM = "MEDIUM"
    WEAK = "WEAK"
    UNKNOWN = "UNKNOWN"

class LearningSpeed(str, enum.Enum):
    STEADY = "STEADY"
    MODERATE = "MODERATE"
    FAST = "FAST"

class PriorityLevel(str, enum.Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"

class QuizDifficulty(str, enum.Enum):
    EASY = "EASY"
    MEDIUM = "MEDIUM"
    HARD = "HARD"
    ADAPTIVE = "ADAPTIVE"

class FlashcardRating(str, enum.Enum):
    AGAIN = "AGAIN"
    HARD = "HARD"
    GOOD = "GOOD"
    EASY = "EASY"

class ActionType(str, enum.Enum):
    REVISE = "REVISE"
    QUIZ = "QUIZ"
    LEARN = "LEARN"
    FLASHCARD = "FLASHCARD"

class RelationshipType(str, enum.Enum):
    PREREQUISITE = "PREREQUISITE"
    RELATED_TO = "RELATED_TO"
    LEADS_TO = "LEADS_TO"

# 1. Student Learning Profile
class StudentLearningProfile(Base):
    __tablename__ = "student_learning_profiles"

    id = Column(String, primary_key=True, default=generate_uuid)
    student_id = Column(String, ForeignKey("students.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    knowledge_level = Column(String, default="BEGINNER", nullable=False)
    learning_speed = Column(String, default="MODERATE", nullable=False)
    preferred_content_format = Column(String, default="SIMPLE", nullable=False) # SIMPLE, DETAILED, ANALOGY, CODE, STEP_BY_STEP
    learning_preferences = Column(JSON, default=dict, nullable=False)
    overall_progress = Column(Integer, default=0, nullable=False) # 0-100%
    quiz_accuracy = Column(Float, default=0.0, nullable=False) # 0-100%
    streak_days = Column(Integer, default=1, nullable=False)
    last_active_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    student = relationship("Student", backref=backref("learning_profile", uselist=False))

# 2. Concept Mastery Tracker
class ConceptMastery(Base):
    __tablename__ = "concept_masteries"

    id = Column(String, primary_key=True, default=generate_uuid)
    student_id = Column(String, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(String, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    concept_name = Column(String(255), nullable=False, index=True)
    status = Column(String, default="UNKNOWN", nullable=False) # STRONG, MEDIUM, WEAK, UNKNOWN
    score = Column(Integer, default=0, nullable=False) # 0-100
    mistakes_count = Column(Integer, default=0, nullable=False)
    last_evaluated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    student = relationship("Student")
    subject = relationship("Subject")

# 3. Diagnostic Assessment
class DiagnosticAssessment(Base):
    __tablename__ = "diagnostic_assessments"

    id = Column(String, primary_key=True, default=generate_uuid)
    student_id = Column(String, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(String, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    chapter_id = Column(String, ForeignKey("chapters.id", ondelete="SET NULL"), nullable=True, index=True)
    total_score = Column(Integer, nullable=False)
    max_score = Column(Integer, nullable=False)
    percentage = Column(Float, nullable=False)
    assigned_level = Column(String, nullable=False) # BEGINNER, INTERMEDIATE, ADVANCED
    topic_results = Column(JSON, nullable=False) # list of { topic, status, score }
    learner_profile = Column(JSON, nullable=True) # 9-signal profile dict
    student_explanation = Column(Text, nullable=True) # Friendly student-facing explanation
    completed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    student = relationship("Student")
    subject = relationship("Subject")
    chapter = relationship("Chapter")

class DiagnosticQuestion(Base):
    __tablename__ = "diagnostic_questions"

    id = Column(String, primary_key=True, default=generate_uuid)
    subject_id = Column(String, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    chapter_id = Column(String, ForeignKey("chapters.id", ondelete="SET NULL"), nullable=True, index=True)
    question_type = Column(String, default="PRIOR_KNOWLEDGE", nullable=False) # PRIOR_KNOWLEDGE, DIFFICULTY_PERCEPTION, INTEREST_LEVEL, VISUAL_PREFERENCE, REAL_WORLD_INTEREST
    concept = Column(String(255), nullable=False)
    question = Column(Text, nullable=False)
    options = Column(JSON, nullable=False) # ["A", "B", "C", "D"]
    correct_option_index = Column(Integer, nullable=True) # Optional for preference questions
    difficulty = Column(String, default="MEDIUM", nullable=False)
    explanation = Column(Text, nullable=True)

    subject = relationship("Subject")
    chapter = relationship("Chapter")

# 4. Quizzes & Attempts
class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    subject_id = Column(String, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    chapter_id = Column(String, ForeignKey("chapters.id", ondelete="SET NULL"), nullable=True, index=True)
    module_id = Column(String, ForeignKey("modules.id", ondelete="SET NULL"), nullable=True, index=True)
    difficulty = Column(String, default="MEDIUM", nullable=False)
    is_ai_generated = Column(Boolean, default=False, nullable=False)
    is_published = Column(Boolean, default=True, nullable=False)
    created_by = Column(String, ForeignKey("teachers.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    subject = relationship("Subject")
    chapter = relationship("Chapter")
    module = relationship("Module")
    creator = relationship("Teacher")
    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan")
    attempts = relationship("QuizAttempt", back_populates="quiz", cascade="all, delete-orphan")

class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(String, primary_key=True, default=generate_uuid)
    quiz_id = Column(String, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    question = Column(Text, nullable=False)
    options = Column(JSON, nullable=False) # list of 4 options
    correct_option_index = Column(Integer, nullable=False)
    explanation = Column(Text, nullable=True)
    concept_tag = Column(String(255), nullable=False)
    difficulty = Column(String, default="MEDIUM", nullable=False)

    quiz = relationship("Quiz", back_populates="questions")

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(String, primary_key=True, default=generate_uuid)
    student_id = Column(String, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    quiz_id = Column(String, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    score = Column(Integer, nullable=False)
    max_score = Column(Integer, nullable=False)
    percentage = Column(Float, nullable=False)
    user_answers = Column(JSON, nullable=False) # { question_id: selected_index }
    concept_breakdown = Column(JSON, nullable=False) # { concept: "STRONG" | "WEAK" }
    completed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    student = relationship("Student")
    quiz = relationship("Quiz", back_populates="attempts")

# 5. Flashcards & Spaced Repetition (SM-2)
class Flashcard(Base):
    __tablename__ = "flashcards"

    id = Column(String, primary_key=True, default=generate_uuid)
    subject_id = Column(String, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    chapter_id = Column(String, ForeignKey("chapters.id", ondelete="SET NULL"), nullable=True, index=True)
    module_id = Column(String, ForeignKey("modules.id", ondelete="SET NULL"), nullable=True, index=True)
    front_question = Column(Text, nullable=False)
    back_answer = Column(Text, nullable=False)
    concept_tag = Column(String(255), nullable=False)
    difficulty = Column(String, default="MEDIUM", nullable=False)
    created_by = Column(String, nullable=True) # "AI" or teacher_id
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    subject = relationship("Subject")
    chapter = relationship("Chapter")
    module = relationship("Module")
    reviews = relationship("FlashcardReview", back_populates="flashcard", cascade="all, delete-orphan")

class FlashcardReview(Base):
    __tablename__ = "flashcard_reviews"

    id = Column(String, primary_key=True, default=generate_uuid)
    student_id = Column(String, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    flashcard_id = Column(String, ForeignKey("flashcards.id", ondelete="CASCADE"), nullable=False, index=True)
    rating = Column(String, nullable=False) # AGAIN, HARD, GOOD, EASY
    repetitions = Column(Integer, default=0, nullable=False)
    interval_days = Column(Integer, default=1, nullable=False)
    ease_factor = Column(Float, default=2.5, nullable=False) # SM-2 ease factor
    next_review_due = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    last_reviewed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    student = relationship("Student")
    flashcard = relationship("Flashcard", back_populates="reviews")

# 6. Revision Queue
class RevisionItem(Base):
    __tablename__ = "revision_items"

    id = Column(String, primary_key=True, default=generate_uuid)
    student_id = Column(String, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(String, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    module_id = Column(String, ForeignKey("modules.id", ondelete="SET NULL"), nullable=True, index=True)
    topic_name = Column(String(255), nullable=False)
    priority = Column(String, default="MEDIUM", nullable=False) # HIGH, MEDIUM, LOW
    reason = Column(Text, nullable=False)
    is_completed = Column(Boolean, default=False, nullable=False, index=True)
    due_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    student = relationship("Student")
    subject = relationship("Subject")
    module = relationship("Module")

# 7. Personalized Notes
class PersonalizedNote(Base):
    __tablename__ = "personalized_notes"

    id = Column(String, primary_key=True, default=generate_uuid)
    student_id = Column(String, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(String, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    module_id = Column(String, ForeignKey("modules.id", ondelete="SET NULL"), nullable=True, index=True)
    topic_title = Column(String(255), nullable=False)
    overview = Column(Text, nullable=False)
    key_concepts = Column(JSON, nullable=False) # list of strings
    simple_explanation = Column(Text, nullable=False)
    important_definitions = Column(JSON, nullable=False) # list of { term, definition }
    examples = Column(JSON, nullable=False) # list of examples
    common_mistakes = Column(JSON, nullable=False) # list of { mistake, correction }
    quick_revision = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    student = relationship("Student")
    subject = relationship("Subject")
    module = relationship("Module")

# 8. Document Chunks & Vector Store for RAG
class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(String, primary_key=True, default=generate_uuid)
    document_id = Column(String, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(String, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    module_id = Column(String, ForeignKey("modules.id", ondelete="SET NULL"), nullable=True, index=True)
    page_number = Column(Integer, nullable=False)
    chunk_index = Column(Integer, nullable=False)
    chunk_text = Column(Text, nullable=False)
    embedding = Column(JSON, nullable=True) # list of float vector
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    document = relationship("Document")
    subject = relationship("Subject")
    module = relationship("Module")

# 9. Knowledge Graph: Nodes & Edges
class KnowledgeNode(Base):
    __tablename__ = "knowledge_nodes"

    id = Column(String, primary_key=True, default=generate_uuid)
    subject_id = Column(String, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    module_id = Column(String, ForeignKey("modules.id", ondelete="SET NULL"), nullable=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    difficulty = Column(String, default="BEGINNER", nullable=False)
    order_index = Column(Integer, default=0, nullable=False)

    subject = relationship("Subject")
    module = relationship("Module")

class KnowledgeEdge(Base):
    __tablename__ = "knowledge_edges"

    id = Column(String, primary_key=True, default=generate_uuid)
    source_node_id = Column(String, ForeignKey("knowledge_nodes.id", ondelete="CASCADE"), nullable=False, index=True)
    target_node_id = Column(String, ForeignKey("knowledge_nodes.id", ondelete="CASCADE"), nullable=False, index=True)
    relationship_type = Column(String, default="PREREQUISITE", nullable=False) # PREREQUISITE, RELATED_TO, LEADS_TO

    source_node = relationship("KnowledgeNode", foreign_keys=[source_node_id])
    target_node = relationship("KnowledgeNode", foreign_keys=[target_node_id])

# 10. Student Recommendations
class StudentRecommendation(Base):
    __tablename__ = "student_recommendations"

    id = Column(String, primary_key=True, default=generate_uuid)
    student_id = Column(String, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    action_type = Column(String, default="LEARN", nullable=False) # REVISE, QUIZ, LEARN, FLASHCARD
    target_url = Column(String(500), nullable=True)
    priority = Column(String, default="MEDIUM", nullable=False) # HIGH, MEDIUM, LOW
    reason = Column(Text, nullable=False)
    is_completed = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    student = relationship("Student")

# 11. Module Completions (tracks student progress on curriculum)
class ModuleCompletion(Base):
    __tablename__ = "module_completions"

    id = Column(String, primary_key=True, default=generate_uuid)
    student_id = Column(String, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    module_id = Column(String, ForeignKey("modules.id", ondelete="CASCADE"), nullable=False, index=True)
    completed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    student = relationship("Student")
    module = relationship("Module")
