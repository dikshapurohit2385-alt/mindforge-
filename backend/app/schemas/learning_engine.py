from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# ----------------- Student Profile Schemas -----------------
class ConceptMasteryOut(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    concept_name: str
    subject_id: str
    status: str
    score: int
    mistakes_count: int
    last_evaluated_at: Optional[datetime] = None

class StudentProfileOut(BaseModel):
    id: str
    student_id: str
    student_name: str
    student_email: str
    class_name: Optional[str] = None
    knowledge_level: str
    learning_speed: str
    preferred_content_format: str
    learning_preferences: Dict[str, Any]
    overall_progress: int
    quiz_accuracy: float
    streak_days: int
    strong_concepts: List[str]
    weak_concepts: List[str]
    frequently_incorrect_concepts: List[Dict[str, Any]]
    completed_topics: List[str]
    topics_requiring_revision: List[str]
    last_active_date: Optional[datetime] = None

class ProfilePreferencesUpdate(BaseModel):
    learning_speed: Optional[str] = None
    preferred_content_format: Optional[str] = None
    learning_preferences: Optional[Dict[str, Any]] = None

# ----------------- Diagnostic Assessment Schemas -----------------
class DiagnosticQuestionOut(BaseModel):
    id: str
    concept: str
    question: str
    options: List[str]
    difficulty: str
    question_type: str = "PRIOR_KNOWLEDGE"

class ChapterDiagnosticQuestionOut(BaseModel):
    id: str
    concept: str
    question: str
    options: List[str]
    difficulty: str
    question_type: str # PRIOR_KNOWLEDGE, DIFFICULTY_PERCEPTION, INTEREST_LEVEL, VISUAL_PREFERENCE, REAL_WORLD_INTEREST

class DiagnosticSubmitIn(BaseModel):
    answers: Dict[str, int] # question_id -> selected_option_index

class TopicAssessmentResult(BaseModel):
    topic: str
    status: str # Strong, Medium, Weak, Unknown
    score: int

class ChapterLearnerProfileOut(BaseModel):
    student_id: str
    chapter_id: str
    knowledge_level: str # foundational, intermediate, advanced
    difficulty_level: str # low, moderate, high
    interest_level: str # low, medium, high
    visual_support_need: str # low, medium, high
    real_world_interest: str # low, medium, high
    content_density: str # low, medium, high
    explanation_complexity: str # simple, moderate, detailed
    example_frequency: str # high, moderate, low
    memory_support: str # high, medium, low
    contradiction_flag: bool = False
    confidence_score: float = 1.0
    student_explanation: str
    completed_at: datetime

class VisualComponentData(BaseModel):
    type: str # comparison_table, flow_diagram, concept_map, labeled_diagram
    title: str
    headers: Optional[List[str]] = None
    rows: Optional[List[List[str]]] = None
    steps: Optional[List[Dict[str, str]]] = None
    nodes: Optional[List[Dict[str, Any]]] = None

class AdaptiveLessonSectionOut(BaseModel):
    title: str
    section_type: str # concept, in_simple_words, visual_comparison, flow_diagram, real_world_application, remember_tip, quick_check
    content: str
    bullet_points: List[str] = []
    visual_component: Optional[VisualComponentData] = None
    quick_check_question: Optional[Dict[str, Any]] = None

class ChapterAdaptiveLessonOut(BaseModel):
    chapter_id: str
    chapter_title: str
    subject_id: str
    subject_name: str
    student_explanation: str
    learner_profile: ChapterLearnerProfileOut
    prerequisites_recap: List[str] = []
    sections: List[AdaptiveLessonSectionOut]

class DiagnosticResultOut(BaseModel):
    assessment_id: str
    subject_id: str
    chapter_id: Optional[str] = None
    total_score: int
    max_score: int
    percentage: float
    assigned_level: str
    topic_results: List[TopicAssessmentResult]
    learner_profile: Optional[ChapterLearnerProfileOut] = None
    student_explanation: Optional[str] = None
    recommended_starting_topic: Optional[str] = None
    completed_at: datetime

# ----------------- Adaptive Learning Path Schemas -----------------
class LearningPathModuleOut(BaseModel):
    id: str
    chapter_id: str
    chapter_title: str
    title: str
    description: Optional[str] = None
    order_index: int
    status: str # COMPLETED, NEEDS_REVISION, CURRENT, LOCKED
    is_locked: bool
    unmet_prerequisites: List[str] = []
    has_documents: bool = False
    mastery_score: Optional[int] = None

class LearningPathOut(BaseModel):
    subject_id: str
    subject_name: str
    total_modules: int
    completed_modules: int
    overall_progress_percentage: int
    current_module: Optional[LearningPathModuleOut] = None
    modules: List[LearningPathModuleOut]

# ----------------- Adaptive Content Generation Schemas -----------------
class AdaptiveExplainIn(BaseModel):
    subject_id: str
    module_id: Optional[str] = None
    topic_title: str
    explanation_level: Optional[str] = None # BEGINNER, INTERMEDIATE, ADVANCED (or uses profile)
    format_type: str = "SIMPLE" # SIMPLE, DETAILED, ANALOGY, CODE, STEP_BY_STEP, QUESTIONS, SUMMARY
    custom_question: Optional[str] = None

class AdaptiveExplainOut(BaseModel):
    topic_title: str
    level: str
    format_type: str
    content: str
    key_points: List[str] = []
    code_snippet: Optional[str] = None
    practice_prompt: Optional[str] = None

# ----------------- Personalized Notes Schemas -----------------
class GenerateNotesIn(BaseModel):
    subject_id: str
    module_id: Optional[str] = None
    topic_title: str

class DefinitionItem(BaseModel):
    term: str
    definition: str

class ExampleItem(BaseModel):
    title: str
    description: str
    code_or_math: Optional[str] = None

class MistakeItem(BaseModel):
    mistake: str
    correction: str
    why: str

class PersonalizedNoteOut(BaseModel):
    id: str
    subject_id: str
    subject_name: Optional[str] = None
    module_id: Optional[str] = None
    topic_title: str
    overview: str
    key_concepts: List[str]
    simple_explanation: str
    important_definitions: List[Dict[str, str]]
    examples: List[Dict[str, Any]]
    common_mistakes: List[Dict[str, str]]
    quick_revision: str
    created_at: datetime

# ----------------- Flashcards & Spaced Repetition Schemas -----------------
class FlashcardOut(BaseModel):
    id: str
    subject_id: str
    subject_name: Optional[str] = None
    chapter_id: Optional[str] = None
    module_id: Optional[str] = None
    front_question: str
    back_answer: str
    concept_tag: str
    difficulty: str
    interval_days: int = 1
    repetitions: int = 0
    next_review_due: Optional[datetime] = None
    is_due: bool = True

class FlashcardReviewIn(BaseModel):
    rating: str # AGAIN, HARD, GOOD, EASY

class FlashcardGenerateIn(BaseModel):
    subject_id: str
    module_id: Optional[str] = None
    topic_title: str
    count: int = 5

# ----------------- Revision Queue Schemas -----------------
class RevisionItemOut(BaseModel):
    id: str
    subject_id: str
    subject_name: str
    module_id: Optional[str] = None
    topic_name: str
    priority: str # HIGH, MEDIUM, LOW
    reason: str
    is_completed: bool
    due_date: datetime
    created_at: datetime

# ----------------- Personalized Quiz Schemas -----------------
class QuizQuestionOut(BaseModel):
    id: str
    question: str
    options: List[str]
    concept_tag: str
    difficulty: str
    # correct_option_index is omitted for student taking quiz

class QuizDetailOut(BaseModel):
    id: str
    title: str
    subject_id: str
    subject_name: Optional[str] = None
    module_id: Optional[str] = None
    difficulty: str
    question_count: int
    questions: List[QuizQuestionOut]

class QuizSubmitIn(BaseModel):
    answers: Dict[str, int] # question_id -> selected_index

class GradedQuestionDetail(BaseModel):
    question_id: str
    question: str
    options: List[str]
    user_answer: int
    correct_answer: int
    is_correct: bool
    explanation: Optional[str] = None
    concept_tag: str

class QuizAttemptOut(BaseModel):
    id: str
    quiz_id: str
    score: int
    max_score: int
    percentage: float
    concept_breakdown: Dict[str, str] # Concept -> STRONG | WEAK
    graded_questions: List[GradedQuestionDetail]
    recommendation: Optional[str] = None
    completed_at: datetime

class QuizGenerateIn(BaseModel):
    subject_id: str
    module_id: Optional[str] = None
    topic_title: Optional[str] = None
    difficulty: str = "ADAPTIVE" # EASY, MEDIUM, HARD, ADAPTIVE
    focus_on_weak_concepts: bool = True
    question_count: int = 5

# ----------------- RAG & Anti-Hallucination Schemas -----------------
class RAGQueryIn(BaseModel):
    subject_id: str
    module_id: Optional[str] = None
    question: str

class RAGCitation(BaseModel):
    document_id: str
    document_title: str
    page_number: int
    snippet: str
    relevance_score: float

class RAGQueryOut(BaseModel):
    question: str
    answer: str
    source_found: bool
    citations: List[RAGCitation]
    confidence_score: float
    anti_hallucination_note: Optional[str] = None

# ----------------- Knowledge Graph Schemas -----------------
class KnowledgeNodeOut(BaseModel):
    id: str
    subject_id: str
    module_id: Optional[str] = None
    name: str
    description: Optional[str] = None
    difficulty: str
    order_index: int
    mastery_status: str # STRONG, MEDIUM, WEAK, UNKNOWN
    mastery_score: int

class KnowledgeEdgeOut(BaseModel):
    id: str
    source_node_id: str
    target_node_id: str
    relationship_type: str

class KnowledgeGraphOut(BaseModel):
    subject_id: str
    subject_name: str
    nodes: List[KnowledgeNodeOut]
    edges: List[KnowledgeEdgeOut]

class PrerequisiteCheckOut(BaseModel):
    can_proceed: bool
    node_id: str
    node_name: str
    unmet_prerequisites: List[Dict[str, Any]]
    recommendation: str

# ----------------- Recommendation Engine Schemas -----------------
class RecommendationOut(BaseModel):
    id: str
    title: str
    description: str
    action_type: str # REVISE, QUIZ, LEARN, FLASHCARD
    target_url: Optional[str] = None
    priority: str # HIGH, MEDIUM, LOW
    reason: str
    created_at: datetime

# ----------------- Teacher Analytics & Assistant Schemas -----------------
class StudentAttentionItem(BaseModel):
    student_id: str
    student_name: str
    email: str
    struggling_topics: List[str]
    quiz_accuracy: float
    overall_progress: int
    risk_level: str # HIGH, MEDIUM

class TopicDifficultyItem(BaseModel):
    topic_name: str
    subject_name: str
    failure_rate_percentage: float
    average_score: float

class TeacherAnalyticsOverviewOut(BaseModel):
    total_students: int
    average_class_progress: float
    average_quiz_accuracy: float
    students_needing_attention: List[StudentAttentionItem]
    most_difficult_topics: List[TopicDifficultyItem]
    most_improved_topics: List[TopicDifficultyItem]

class StudentCohortItemOut(BaseModel):
    student_id: str
    user_id: str
    name: str
    email: str
    class_name: Optional[str] = None
    knowledge_level: str
    overall_progress: int
    quiz_accuracy: float
    streak_days: int
    weak_concept_count: int

class StudentAnalyticsDetailOut(BaseModel):
    student_id: str
    student_name: str
    email: str
    knowledge_level: str
    learning_speed: str
    overall_progress: int
    quiz_accuracy: float
    streak_days: int
    strong_concepts: List[str]
    weak_concepts: List[str]
    frequently_incorrect_concepts: List[Dict[str, Any]]
    quiz_history: List[Dict[str, Any]]
    revision_items: List[Dict[str, Any]]
    recommended_intervention: str

class TeacherAssistantGenerateIn(BaseModel):
    subject_id: str
    content_type: str # QUIZ, FLASHCARDS, SUMMARY, LESSON_PLAN, ASSIGNMENT
    topic: str
    difficulty: str = "MEDIUM"
    item_count: int = 5
    additional_instructions: Optional[str] = None

class TeacherAssistantGenerateOut(BaseModel):
    content_type: str
    topic: str
    difficulty: str
    generated_data: Any

class TeacherPublishQuizIn(BaseModel):
    subject_id: str
    chapter_id: Optional[str] = None
    module_id: Optional[str] = None
    title: str
    difficulty: str
    questions: List[Dict[str, Any]] # [ { question, options, correct_option_index, explanation, concept_tag, difficulty } ]

class TeacherPublishFlashcardsIn(BaseModel):
    subject_id: str
    chapter_id: Optional[str] = None
    module_id: Optional[str] = None
    flashcards: List[Dict[str, str]] # [ { front_question, back_answer, concept_tag, difficulty } ]
