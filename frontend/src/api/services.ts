import { apiClient } from './client';
import type { 
  User, 
  Subject, 
  Chapter, 
  Module, 
  StudentNote, 
  AskTeacherQuestion, 
  QuestionStatus,
  DocumentItem,
  DocumentDetail,
  ExtractedContentItem,
  DocumentStatus as DocStatusType,
  StudentProfile,
  DiagnosticQuestion,
  DiagnosticResult,
  LearningPathData,
  AdaptiveExplainResponse,
  PersonalizedNoteItem,
  FlashcardItem,
  RevisionItem,
  QuizItem,
  QuizAttemptResult,
  RAGQueryResponse,
  KnowledgeGraphData,
  PrerequisiteCheckResult,
  RecommendationItem,
  TeacherAnalyticsOverview,
  StudentCohortItem,
  StudentAnalyticsDetail
} from '../types';

// Auth Services
export const authService = {
  login: async (email: string, password: string) => {
    const res = await apiClient.post<{ access_token: string }>('/auth/login', { email, password });
    return res.data;
  },
  register: async (data: { name: string; email: string; password: string; role: 'STUDENT' | 'TEACHER'; class_name?: string }) => {
    const res = await apiClient.post<User>('/auth/register', data);
    return res.data;
  },
  getMe: async () => {
    const res = await apiClient.get<User>('/auth/me');
    return res.data;
  }
};

// Subject Services
export const subjectService = {
  getAll: async () => {
    const res = await apiClient.get<Subject[]>('/subjects');
    return res.data;
  },
  getById: async (id: string) => {
    const res = await apiClient.get<Subject>(`/subjects/${id}`);
    return res.data;
  },
  create: async (data: { name: string; description?: string }) => {
    const res = await apiClient.post<Subject>('/subjects', data);
    return res.data;
  },
  update: async (id: string, data: { name?: string; description?: string }) => {
    const res = await apiClient.put<Subject>(`/subjects/${id}`, data);
    return res.data;
  },
  delete: async (id: string) => {
    await apiClient.delete(`/subjects/${id}`);
  }
};

// Chapter Services
export const chapterService = {
  getBySubject: async (subjectId: string) => {
    const res = await apiClient.get<Chapter[]>(`/subjects/${subjectId}/chapters`);
    return res.data;
  },
  create: async (subjectId: string, data: { title: string; description?: string; order_index?: number }) => {
    const res = await apiClient.post<Chapter>(`/subjects/${subjectId}/chapters`, data);
    return res.data;
  },
  update: async (id: string, data: { title?: string; description?: string; order_index?: number }) => {
    const res = await apiClient.put<Chapter>(`/chapters/${id}`, data);
    return res.data;
  },
  delete: async (id: string) => {
    await apiClient.delete(`/chapters/${id}`);
  }
};

// Module Services
export const moduleService = {
  getByChapter: async (chapterId: string) => {
    const res = await apiClient.get<Module[]>(`/chapters/${chapterId}/modules`);
    return res.data;
  },
  create: async (chapterId: string, data: { title: string; description?: string; order_index?: number }) => {
    const res = await apiClient.post<Module>(`/chapters/${chapterId}/modules`, data);
    return res.data;
  },
  update: async (id: string, data: { title?: string; description?: string; order_index?: number }) => {
    const res = await apiClient.put<Module>(`/modules/${id}`, data);
    return res.data;
  },
  delete: async (id: string) => {
    await apiClient.delete(`/modules/${id}`);
  }
};

// Note Services
export const noteService = {
  getAll: async (filters?: { subject_id?: string; chapter_id?: string; module_id?: string }) => {
    const params = new URLSearchParams();
    if (filters?.subject_id) params.append('subject_id', filters.subject_id);
    if (filters?.chapter_id) params.append('chapter_id', filters.chapter_id);
    if (filters?.module_id) params.append('module_id', filters.module_id);

    const res = await apiClient.get<StudentNote[]>(`/notes?${params.toString()}`);
    return res.data;
  },
  getById: async (id: string) => {
    const res = await apiClient.get<StudentNote>(`/notes/${id}`);
    return res.data;
  },
  create: async (data: { subject_id: string; chapter_id?: string; module_id?: string; title: string; content: string }) => {
    const res = await apiClient.post<StudentNote>('/notes', data);
    return res.data;
  },
  update: async (id: string, data: { title?: string; content?: string; subject_id?: string; chapter_id?: string; module_id?: string }) => {
    const res = await apiClient.put<StudentNote>(`/notes/${id}`, data);
    return res.data;
  },
  delete: async (id: string) => {
    await apiClient.delete(`/notes/${id}`);
  }
};

// Ask Teacher Services
export const askTeacherService = {
  submitQuestion: async (data: { subject_id: string; chapter_id?: string; module_id?: string; selected_text?: string; question: string }) => {
    const res = await apiClient.post<AskTeacherQuestion>('/ask-teacher', data);
    return res.data;
  },
  getStudentQuestions: async () => {
    const res = await apiClient.get<AskTeacherQuestion[]>('/ask-teacher/student');
    return res.data;
  },
  getTeacherQuestions: async () => {
    const res = await apiClient.get<AskTeacherQuestion[]>('/ask-teacher/teacher');
    return res.data;
  },
  answerQuestion: async (id: string, data: { answer: string; status?: QuestionStatus }) => {
    const res = await apiClient.post<AskTeacherQuestion>(`/ask-teacher/${id}/answer`, data);
    return res.data;
  }
};

// Document Services (Phase 2)
export const documentService = {
  upload: async (formData: FormData) => {
    const res = await apiClient.post<DocumentItem>('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
  getAll: async (filters?: { subject_id?: string; chapter_id?: string; module_id?: string; status?: DocStatusType }) => {
    const params = new URLSearchParams();
    if (filters?.subject_id) params.append('subject_id', filters.subject_id);
    if (filters?.chapter_id) params.append('chapter_id', filters.chapter_id);
    if (filters?.module_id) params.append('module_id', filters.module_id);
    if (filters?.status) params.append('status', filters.status);

    const res = await apiClient.get<DocumentItem[]>(`/documents?${params.toString()}`);
    return res.data;
  },
  getById: async (id: string) => {
    const res = await apiClient.get<DocumentDetail>(`/documents/${id}`);
    return res.data;
  },
  getContent: async (id: string, page?: number) => {
    const params = new URLSearchParams();
    if (page !== undefined) params.append('page', page.toString());
    const res = await apiClient.get<ExtractedContentItem[]>(`/documents/${id}/content?${params.toString()}`);
    return res.data;
  },
  updateContent: async (id: string, contentId: string, data: { content_text: string; structured_data?: any }) => {
    const res = await apiClient.put<ExtractedContentItem>(`/documents/${id}/content/${contentId}`, data);
    return res.data;
  },
  review: async (id: string, data: { status: 'APPROVED' | 'REJECTED'; comment?: string }) => {
    const res = await apiClient.post<DocumentItem>(`/documents/${id}/review`, data);
    return res.data;
  },
  delete: async (id: string) => {
    await apiClient.delete(`/documents/${id}`);
  },
  downloadBlob: async (id: string, filename: string) => {
    const response = await apiClient.get(`/documents/${id}/download`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};

// ==================== Phase 3 & 4 Services ====================

// Student Learning Profile Services
export const profileService = {
  getMe: async () => {
    const res = await apiClient.get<StudentProfile>('/profile/me');
    return res.data;
  },
  updatePreferences: async (data: { learning_speed?: string; preferred_content_format?: string; learning_preferences?: any }) => {
    const res = await apiClient.put<StudentProfile>('/profile/me/preferences', data);
    return res.data;
  }
};

// Diagnostic Assessment Services
export const diagnosticService = {
  getQuestions: async (subjectId: string) => {
    const res = await apiClient.get<DiagnosticQuestion[]>(`/diagnostic/${subjectId}/questions`);
    return res.data;
  },
  submitAssessment: async (subjectId: string, answers: Record<string, number>) => {
    const res = await apiClient.post<DiagnosticResult>(`/diagnostic/${subjectId}/submit`, { answers });
    return res.data;
  },
  getHistory: async (subjectId: string) => {
    const res = await apiClient.get<DiagnosticResult[]>(`/diagnostic/${subjectId}/history`);
    return res.data;
  }
};

// Adaptive Learning Path Services
export const learningPathService = {
  getPath: async (subjectId: string) => {
    const res = await apiClient.get<LearningPathData>(`/learning-path/${subjectId}`);
    return res.data;
  },
  completeModule: async (moduleId: string) => {
    const res = await apiClient.post<{ status: string; message: string }>(`/learning-path/module/${moduleId}/complete`);
    return res.data;
  }
};

// Adaptive Content & Personalized Notes Services
export const adaptiveContentService = {
  explain: async (data: { subject_id: string; module_id?: string; topic_title: string; explanation_level?: string; format_type?: string; custom_question?: string }) => {
    const res = await apiClient.post<AdaptiveExplainResponse>('/adaptive-content/explain', data);
    return res.data;
  },
  generateNotes: async (data: { subject_id: string; module_id?: string; topic_title: string }) => {
    const res = await apiClient.post<PersonalizedNoteItem>('/adaptive-content/generate-notes', data);
    return res.data;
  },
  getNotes: async (filters?: { subject_id?: string; module_id?: string }) => {
    const params = new URLSearchParams();
    if (filters?.subject_id) params.append('subject_id', filters.subject_id);
    if (filters?.module_id) params.append('module_id', filters.module_id);
    const res = await apiClient.get<PersonalizedNoteItem[]>(`/adaptive-content/notes?${params.toString()}`);
    return res.data;
  }
};

// Flashcards & Spaced Repetition (SM-2) Services
export const flashcardService = {
  getAll: async (filters?: { subject_id?: string; module_id?: string; due_only?: boolean }) => {
    const params = new URLSearchParams();
    if (filters?.subject_id) params.append('subject_id', filters.subject_id);
    if (filters?.module_id) params.append('module_id', filters.module_id);
    if (filters?.due_only) params.append('due_only', 'true');
    const res = await apiClient.get<FlashcardItem[]>(`/flashcards?${params.toString()}`);
    return res.data;
  },
  generate: async (data: { subject_id: string; module_id?: string; topic_title: string; count?: number }) => {
    const res = await apiClient.post<FlashcardItem[]>('/flashcards/generate', data);
    return res.data;
  },
  review: async (id: string, rating: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY') => {
    const res = await apiClient.post<{ status: string; rating: string; interval_days: number; next_review_due: string }>(`/flashcards/${id}/review`, { rating });
    return res.data;
  }
};

// Revision Queue Services
export const revisionService = {
  getQueue: async () => {
    const res = await apiClient.get<RevisionItem[]>('/revision/queue');
    return res.data;
  },
  complete: async (id: string) => {
    const res = await apiClient.post<{ status: string; message: string }>(`/revision/${id}/complete`);
    return res.data;
  }
};

// Personalized Quizzes Services
export const quizService = {
  getAll: async (filters?: { subject_id?: string; module_id?: string }) => {
    const params = new URLSearchParams();
    if (filters?.subject_id) params.append('subject_id', filters.subject_id);
    if (filters?.module_id) params.append('module_id', filters.module_id);
    const res = await apiClient.get<QuizItem[]>(`/quizzes?${params.toString()}`);
    return res.data;
  },
  getById: async (id: string) => {
    const res = await apiClient.get<QuizItem>(`/quizzes/${id}`);
    return res.data;
  },
  generate: async (data: { subject_id: string; module_id?: string; topic_title?: string; difficulty?: string; question_count?: number }) => {
    const res = await apiClient.post<QuizItem>('/quizzes/generate', data);
    return res.data;
  },
  submit: async (id: string, answers: Record<string, number>) => {
    const res = await apiClient.post<QuizAttemptResult>(`/quizzes/${id}/submit`, { answers });
    return res.data;
  }
};

// RAG Q&A Services
export const ragService = {
  query: async (data: { subject_id: string; module_id?: string; question: string }) => {
    const res = await apiClient.post<RAGQueryResponse>('/rag/query', data);
    return res.data;
  },
  indexApproved: async () => {
    const res = await apiClient.post<{ status: string; documents_indexed: number; total_chunks_created: number }>('/rag/index-approved');
    return res.data;
  }
};

// Knowledge Graph Services
export const knowledgeGraphService = {
  getGraph: async (subjectId: string) => {
    const res = await apiClient.get<KnowledgeGraphData>(`/knowledge-graph/${subjectId}`);
    return res.data;
  },
  checkPrerequisites: async (subjectId: string, nodeId: string) => {
    const res = await apiClient.get<PrerequisiteCheckResult>(`/knowledge-graph/${subjectId}/prerequisites/${nodeId}`);
    return res.data;
  }
};

// Recommendations Engine Services
export const recommendationService = {
  getAll: async () => {
    const res = await apiClient.get<RecommendationItem[]>('/recommendations');
    return res.data;
  },
  dismiss: async (id: string) => {
    const res = await apiClient.post<{ status: string; message: string }>(`/recommendations/${id}/dismiss`);
    return res.data;
  }
};

// Teacher Analytics & AI Assistant Services
export const teacherAnalyticsService = {
  getOverview: async () => {
    const res = await apiClient.get<TeacherAnalyticsOverview>('/teacher/analytics/overview');
    return res.data;
  },
  getCohort: async () => {
    const res = await apiClient.get<StudentCohortItem[]>('/teacher/analytics/students');
    return res.data;
  },
  getStudentDetail: async (studentId: string) => {
    const res = await apiClient.get<StudentAnalyticsDetail>(`/teacher/analytics/students/${studentId}`);
    return res.data;
  }
};

export const teacherAssistantService = {
  generate: async (data: { subject_id: string; content_type: string; topic: string; difficulty?: string; item_count?: number; additional_instructions?: string }) => {
    const res = await apiClient.post<{ content_type: string; topic: string; difficulty: string; generated_data: any }>('/teacher/assistant/generate', data);
    return res.data;
  },
  publishQuiz: async (data: { subject_id: string; chapter_id?: string; module_id?: string; title: string; difficulty: string; questions: any[] }) => {
    const res = await apiClient.post<{ status: string; message: string; quiz_id: string }>('/teacher/assistant/publish-quiz', data);
    return res.data;
  },
  publishFlashcards: async (data: { subject_id: string; chapter_id?: string; module_id?: string; flashcards: any[] }) => {
    const res = await apiClient.post<{ status: string; message: string }>('/teacher/assistant/publish-flashcards', data);
    return res.data;
  }
};


