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
  DocumentStatus as DocStatusType
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

