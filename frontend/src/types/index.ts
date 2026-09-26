export type UserRole = 'STUDENT' | 'TEACHER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
  student_profile?: {
    id: string;
    user_id: string;
    institution_id?: string;
    class_name?: string;
    created_at: string;
  };
  teacher_profile?: {
    id: string;
    user_id: string;
    institution_id?: string;
    created_at: string;
  };
}

export interface Module {
  id: string;
  chapter_id: string;
  title: string;
  description?: string;
  order_index: number;
  created_at: string;
}

export interface Chapter {
  id: string;
  subject_id: string;
  title: string;
  description?: string;
  order_index: number;
  created_at: string;
  modules: Module[];
}

export interface Subject {
  id: string;
  name: string;
  description?: string;
  teacher_id: string;
  teacher_name?: string;
  class_id?: string;
  class_name?: string;
  chapter_count?: number;
  chapters: Chapter[];
  created_at: string;
}

export interface StudentNote {
  id: string;
  student_id: string;
  subject_id: string;
  chapter_id?: string;
  module_id?: string;
  subject_name?: string;
  chapter_title?: string;
  module_title?: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export type QuestionStatus = 'PENDING' | 'ANSWERED' | 'RESOLVED';

export interface AskTeacherQuestion {
  id: string;
  student_id: string;
  student_name?: string;
  teacher_id: string;
  teacher_name?: string;
  subject_id: string;
  subject_name?: string;
  chapter_id?: string;
  chapter_title?: string;
  module_id?: string;
  module_title?: string;
  selected_text?: string;
  question: string;
  answer?: string;
  status: QuestionStatus;
  created_at: string;
  answered_at?: string;
}

export type DocumentStatus = 'UPLOADED' | 'PROCESSING' | 'EXTRACTED' | 'REVIEW_REQUIRED' | 'APPROVED' | 'REJECTED' | 'FAILED';

export type ExtractionMethod = 'DIRECT_TEXT' | 'OCR' | 'HYBRID' | 'SCANNED_NEEDS_OCR';

export interface StructuredSection {
  type: 'heading' | 'subheading' | 'paragraph' | 'list' | 'table';
  level?: number;
  text?: string;
  items?: string[];
}

export interface StructuredData {
  page: number;
  title?: string;
  headings: string[];
  sections: StructuredSection[];
  learning_topics: string[];
  has_tables: boolean;
  confidence_score: number;
}

export interface ExtractedContentItem {
  id: string;
  document_id: string;
  page_number: number;
  content_text: string;
  structured_data?: StructuredData;
  extraction_method: ExtractionMethod;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  page_count: number;
  status: DocumentStatus;
  error_message?: string;
  subject_id: string;
  chapter_id?: string;
  module_id?: string;
  subject_name?: string;
  chapter_title?: string;
  module_title?: string;
  uploaded_by: string;
  uploader_name?: string;
  reviewed_by?: string;
  reviewer_name?: string;
  review_comment?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentDetail extends DocumentItem {
  contents: ExtractedContentItem[];
}

// ==================== Phase 3 & 4: Learning Engine Types ====================

export interface ConceptMastery {
  id: string;
  concept_name: string;
  subject_id: string;
  status: 'STRONG' | 'MEDIUM' | 'WEAK' | 'UNKNOWN';
  score: number;
  mistakes_count: number;
  last_evaluated_at?: string;
}

export interface StudentProfile {
  id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  class_name?: string;
  knowledge_level: string;
  learning_speed: string;
  preferred_content_format: string;
  learning_preferences: Record<string, any>;
  overall_progress: number;
  quiz_accuracy: number;
  streak_days: number;
  strong_concepts: string[];
  weak_concepts: string[];
  frequently_incorrect_concepts: Array<{ concept: string; mistakes_count: number; score: number }>;
  completed_topics: string[];
  topics_requiring_revision: string[];
  last_active_date?: string;
}

export interface DiagnosticQuestion {
  id: string;
  concept: string;
  question: string;
  options: string[];
  difficulty: string;
}

export interface TopicAssessmentResult {
  topic: string;
  status: string; // Strong, Medium, Weak, Unknown
  score: number;
}

export interface DiagnosticResult {
  assessment_id: string;
  subject_id: string;
  total_score: number;
  max_score: number;
  percentage: number;
  assigned_level: string;
  topic_results: TopicAssessmentResult[];
  recommended_starting_topic?: string;
  completed_at: string;
}

export interface LearningPathModule {
  id: string;
  chapter_id: string;
  chapter_title: string;
  title: string;
  description?: string;
  order_index: number;
  status: 'COMPLETED' | 'NEEDS_REVISION' | 'CURRENT' | 'LOCKED';
  is_locked: boolean;
  unmet_prerequisites: string[];
  has_documents: boolean;
  mastery_score?: number;
}

export interface LearningPathData {
  subject_id: string;
  subject_name: string;
  total_modules: number;
  completed_modules: number;
  overall_progress_percentage: number;
  current_module?: LearningPathModule;
  modules: LearningPathModule[];
}

export interface AdaptiveExplainResponse {
  topic_title: string;
  level: string;
  format_type: string;
  content: string;
  key_points: string[];
  code_snippet?: string;
  practice_prompt?: string;
}

export interface PersonalizedNoteItem {
  id: string;
  subject_id: string;
  subject_name?: string;
  module_id?: string;
  topic_title: string;
  overview: string;
  key_concepts: string[];
  simple_explanation: string;
  important_definitions: Array<{ term: string; definition: string }>;
  examples: Array<{ title: string; description: string; code_or_math?: string }>;
  common_mistakes: Array<{ mistake: string; correction: string; why: string }>;
  quick_revision: string;
  created_at: string;
}

export interface FlashcardItem {
  id: string;
  subject_id: string;
  subject_name?: string;
  chapter_id?: string;
  module_id?: string;
  front_question: string;
  back_answer: string;
  concept_tag: string;
  difficulty: string;
  interval_days: number;
  repetitions: number;
  next_review_due?: string;
  is_due: boolean;
}

export interface RevisionItem {
  id: string;
  subject_id: string;
  subject_name: string;
  module_id?: string;
  topic_name: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
  is_completed: boolean;
  due_date: string;
  created_at: string;
}

export interface QuizQuestionItem {
  id: string;
  question: string;
  options: string[];
  concept_tag: string;
  difficulty: string;
}

export interface QuizItem {
  id: string;
  title: string;
  subject_id: string;
  subject_name?: string;
  module_id?: string;
  difficulty: string;
  question_count: number;
  questions: QuizQuestionItem[];
}

export interface GradedQuestion {
  question_id: string;
  question: string;
  options: string[];
  user_answer: number;
  correct_answer: number;
  is_correct: boolean;
  explanation?: string;
  concept_tag: string;
}

export interface QuizAttemptResult {
  id: string;
  quiz_id: string;
  score: number;
  max_score: number;
  percentage: number;
  concept_breakdown: Record<string, string>;
  graded_questions: GradedQuestion[];
  recommendation?: string;
  completed_at: string;
}

export interface RAGCitation {
  document_id: string;
  document_title: string;
  page_number: number;
  snippet: string;
  relevance_score: number;
}

export interface RAGQueryResponse {
  question: string;
  answer: string;
  source_found: boolean;
  citations: RAGCitation[];
  confidence_score: number;
  anti_hallucination_note?: string;
}

export interface KnowledgeNodeItem {
  id: string;
  subject_id: string;
  module_id?: string;
  name: string;
  description?: string;
  difficulty: string;
  order_index: number;
  mastery_status: 'STRONG' | 'MEDIUM' | 'WEAK' | 'UNKNOWN';
  mastery_score: number;
}

export interface KnowledgeEdgeItem {
  id: string;
  source_node_id: string;
  target_node_id: string;
  relationship_type: string;
}

export interface KnowledgeGraphData {
  subject_id: string;
  subject_name: string;
  nodes: KnowledgeNodeItem[];
  edges: KnowledgeEdgeItem[];
}

export interface PrerequisiteCheckResult {
  can_proceed: boolean;
  node_id: string;
  node_name: string;
  unmet_prerequisites: Array<{ prerequisite_id: string; prerequisite_name: string; reason: string }>;
  recommendation: string;
}

export interface RecommendationItem {
  id: string;
  title: string;
  description: string;
  action_type: 'REVISE' | 'QUIZ' | 'LEARN' | 'FLASHCARD';
  target_url?: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
  created_at: string;
}

export interface StudentAttentionItem {
  student_id: string;
  student_name: string;
  email: string;
  struggling_topics: string[];
  quiz_accuracy: number;
  overall_progress: number;
  risk_level: 'HIGH' | 'MEDIUM';
}

export interface TopicDifficultyItem {
  topic_name: string;
  subject_name: string;
  failure_rate_percentage: number;
  average_score: number;
}

export interface TeacherAnalyticsOverview {
  total_students: number;
  average_class_progress: number;
  average_quiz_accuracy: number;
  students_needing_attention: StudentAttentionItem[];
  most_difficult_topics: TopicDifficultyItem[];
  most_improved_topics: TopicDifficultyItem[];
}

export interface StudentCohortItem {
  student_id: string;
  user_id: string;
  name: string;
  email: string;
  class_name?: string;
  knowledge_level: string;
  overall_progress: number;
  quiz_accuracy: number;
  streak_days: number;
  weak_concept_count: number;
}

export interface StudentAnalyticsDetail {
  student_id: string;
  student_name: string;
  email: string;
  knowledge_level: string;
  learning_speed: string;
  overall_progress: number;
  quiz_accuracy: number;
  streak_days: number;
  strong_concepts: string[];
  weak_concepts: string[];
  frequently_incorrect_concepts: Array<{ concept: string; mistakes_count: number; score: number }>;
  quiz_history: Array<{ id: string; quiz_title: string; score: number; max_score: number; percentage: number; completed_at: string }>;
  revision_items: Array<{ id: string; topic: string; priority: string; reason: string; due_date: string }>;
  recommended_intervention: string;
}

export interface ChapterDiagnosticQuestion {
  id: string;
  concept: string;
  question: string;
  options: string[];
  difficulty: string;
  question_type: 'PRIOR_KNOWLEDGE' | 'DIFFICULTY_PERCEPTION' | 'INTEREST_LEVEL' | 'VISUAL_PREFERENCE' | 'REAL_WORLD_INTEREST';
}

export interface ChapterLearnerProfile {
  student_id: string;
  chapter_id: string;
  knowledge_level: 'foundational' | 'intermediate' | 'advanced';
  difficulty_level: 'low' | 'moderate' | 'high';
  interest_level: 'low' | 'medium' | 'high';
  visual_support_need: 'low' | 'medium' | 'high';
  real_world_interest: 'low' | 'medium' | 'high';
  content_density: 'low' | 'medium' | 'high';
  explanation_complexity: 'simple' | 'moderate' | 'detailed';
  example_frequency: 'high' | 'moderate' | 'low';
  memory_support: 'high' | 'medium' | 'low';
  contradiction_flag: boolean;
  confidence_score: number;
  student_explanation: string;
  completed_at: string;
}

export interface VisualComponentData {
  type: 'flow_diagram' | 'comparison_table' | 'concept_map' | 'labeled_diagram';
  title: string;
  headers?: string[];
  rows?: string[][];
  steps?: Array<{ step_number: string; title: string; description: string }>;
  nodes?: Array<{ id: string; label: string; details?: string }>;
}

export interface AdaptiveLessonSection {
  title: string;
  section_type: 'concept' | 'in_simple_words' | 'visual_comparison' | 'flow_diagram' | 'real_world_application' | 'remember_tip' | 'quick_check';
  content: string;
  bullet_points: string[];
  visual_component?: VisualComponentData;
  quick_check_question?: {
    question: string;
    options: string[];
    correct_option_index: number;
    explanation?: string;
  };
}

export interface ChapterAdaptiveLesson {
  chapter_id: string;
  chapter_title: string;
  subject_id: string;
  subject_name: string;
  student_explanation: string;
  learner_profile: ChapterLearnerProfile;
  prerequisites_recap: string[];
  sections: AdaptiveLessonSection[];
}

// Phase 7 Types
export interface SchoolClass {
  id: string;
  name: string;
  grade_level: number;
  created_at: string;
  subject_count?: number;
}

export interface SubjectAttendanceSummary {
  subject_id: string;
  subject_name: string;
  class_name?: string;
  total_classes: number;
  attended_classes: number;
  missed_classes: number;
  attendance_percentage: number;
  status_label: 'On track' | 'Monitor' | 'Catch-up recommended';
  needs_catchup: boolean;
  catchup_tier?: 'ACCELERATED' | 'FOUNDATIONAL';
}

export interface StudentAttendanceRosterItem {
  student_id: string;
  student_name: string;
  total_classes: number;
  attended_classes: number;
  missed_classes: number;
  attendance_percentage: number;
  status_label: string;
  quiz_accuracy: number;
  needs_catchup: boolean;
}

export interface CatchUpSection {
  title: string;
  section_type: 'missed_concepts' | 'key_definitions' | 'visual_diagram' | 'short_explanation' | 'key_examples' | 'quick_check';
  content: string;
  bullet_points?: string[];
  diagram_headers?: string[];
  diagram_rows?: string[][];
}

export interface CatchUpPathData {
  subject_id: string;
  subject_name: string;
  attendance_percentage: number;
  quiz_accuracy: number;
  catchup_tier: 'ACCELERATED' | 'FOUNDATIONAL';
  recommendation_summary: string;
  missed_chapters: string[];
  sections: CatchUpSection[];
}

export interface TextHighlight {
  id: string;
  student_id: string;
  subject_id: string;
  chapter_id?: string;
  module_id?: string;
  selected_text: string;
  color: 'yellow' | 'blue' | 'green';
  created_at: string;
}

export interface TextComment {
  id: string;
  student_id: string;
  subject_id: string;
  chapter_id?: string;
  module_id?: string;
  selected_text: string;
  comment_text: string;
  created_at: string;
  updated_at: string;
}

export interface ContextualAIAskResponse {
  selected_text: string;
  mode: string;
  explanation: string;
  answer?: string;
  citations?: string[];
  key_points: string[];
  real_world_analogy?: string;
}



