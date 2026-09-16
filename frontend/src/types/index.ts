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
