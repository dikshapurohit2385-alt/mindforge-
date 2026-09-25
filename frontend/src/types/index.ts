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

